const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const app = express();
const port = 3000;
const secretKey = '7554817'; // Замените на свой секретный ключ

// Middleware для работы с JSON
app.use(express.json());

// Настроим соединение с базой данных
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'task4'
});

// Подключение к базе данных
db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
        return;
    }
    console.log('Подключение к базе данных установлено.');
});

app.get('/', (req, res) => {
    res.send('Hello Task4!');
});

// Маршрут для регистрации пользователей
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Недостаточно данных для регистрации.');
    }

    try {
        // Хэшируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Вставляем пользователя в базу данных
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).send('Ошибка сервера при регистрации.');
            }

            // Генерируем токен
            const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' });

            res.status(201).json({ token, userName: username });
        });
    } catch (error) {
        res.status(500).send('Ошибка сервера при регистрации.');
    }
});

// Маршрут для входа пользователей
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Недостаточно данных для входа.');
    }

    // Проверяем пользователя
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            return res.status(500).send('Ошибка сервера при входе.');
        }

        if (results.length === 0) {
            return res.status(401).send('Неверные учетные данные.');
        }

        const user = results[0];

        // Проверяем пароль
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).send('Неверные учетные данные.');
        }

        // Обновляем время последнего входа
        const updateQuery = 'UPDATE users SET last_login = NOW() WHERE id = ?';
        db.query(updateQuery, [user.id], (err) => {
            if (err) {
                return res.status(500).send('Ошибка сервера при обновлении времени последнего входа.');
            }

            // Генерируем токен
            const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });

            res.json({ token, userName: user.username });
        });
    });
});

// Маршрут для получения списка пользователей
app.get('/api/users', (req, res) => {
    const query = 'SELECT id, username, email, registration_date, last_login, status FROM users WHERE status IN (\'active\', \'blocked\')';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Ошибка сервера при получении пользователей.');
        }

        res.json(results);
    });
});

// Маршрут для блокировки пользователей
app.post('/api/block', (req, res) => {
    const { userIds } = req.body;

    if (!userIds || userIds.length === 0) {
        return res.status(400).send('Нет пользователей для блокировки.');
    }

    const query = 'UPDATE users SET status = "blocked" WHERE id IN (?)';
    db.query(query, [userIds], (err, result) => {
        if (err) return res.status(500).send('Ошибка сервера при блокировке пользователей.');
        res.status(200).send({ message: 'Пользователи заблокированы!' });
    });
});

// Маршрут для разблокировки пользователей
app.post('/api/unblock', (req, res) => {
    const { userIds } = req.body;

    if (!userIds || userIds.length === 0) {
        return res.status(400).send('Нет пользователей для разблокировки.');
    }

    const query = 'UPDATE users SET status = "active" WHERE id IN (?)';
    db.query(query, [userIds], (err, result) => {
        if (err) return res.status(500).send('Ошибка сервера при разблокировке пользователей.');
        res.status(200).send({ message: 'Пользователи разблокированы!' });
    });
});

// Маршрут для удаления пользователей
app.post('/api/delete', (req, res) => {
    const { userIds } = req.body;

    if (!userIds || userIds.length === 0) {
        return res.status(400).send('Нет пользователей для удаления.');
    }

    const query = 'DELETE FROM users WHERE id IN (?)';
    db.query(query, [userIds], (err, result) => {
        if (err) return res.status(500).send('Ошибка сервера при удалении пользователей.');
        res.status(200).send({ message: 'Пользователи удалены!' });
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
