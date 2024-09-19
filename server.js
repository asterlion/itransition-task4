const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const app = express();
const port = 3000;
const secretKey = '7554817';

// Middleware для работы с JSON
app.use(express.json());

// Настроим соединение с базой данных
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'task4'
});

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Требуется авторизация.' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Неверный или истекший токен.' });
        }

        const query = 'SELECT status FROM users WHERE username = ?';
        db.query(query, [decoded.username], (err, results) => {
            if (err || results.length === 0) {
                return res.status(403).json({ message: 'Пользователь не найден.' });
            }

            const userStatus = results[0].status;
            if (userStatus === 'blocked' || userStatus === 'deleted') {
                return res.status(403).json({ message: 'Пользователь заблокирован или удалён.' });
            }

            req.user = decoded;
            next();
        });
    });
};

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
app.get('/api/users', authenticateJWT, (req, res) => {
    const query = 'SELECT id, username, email, registration_date, last_login, status FROM users WHERE status IN (\'active\', \'blocked\')';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Ошибка сервера при получении пользователей.');
        }

        res.json(results);
    });
});

// Маршрут для блокировки пользователей
app.post('/api/block', authenticateJWT, (req, res) => {
    const { userIds } = req.body;
    const currentUserId = req.user.id; // Текущий пользователь

    if (!userIds || userIds.length === 0) {
        return res.status(400).send('Нет пользователей для блокировки.');
    }

    // Проверяем, пытается ли текущий пользователь заблокировать себя
    if (userIds.includes(currentUserId)) {
        return res.status(403).send('Нельзя заблокировать себя.');
    }

    const query = 'UPDATE users SET status = "blocked" WHERE id IN (?)';
    db.query(query, [userIds], (err, result) => {
        if (err) return res.status(500).send('Ошибка сервера при блокировке пользователей.');

        // Если пользователь заблокировал других, но сам себя не заблокировал, возвращаем успех
        res.status(200).send({ message: 'Пользователи заблокированы!' });
    });
});


// Маршрут для разблокировки пользователей
app.post('/api/unblock', authenticateJWT, (req, res) => {
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
app.post('/api/delete', authenticateJWT, (req, res) => {
    const { userIds } = req.body;
    const currentUserId = req.user.id; // Текущий пользователь

    if (!userIds || userIds.length === 0) {
        return res.status(400).send('Нет пользователей для удаления.');
    }

    // Проверяем, пытается ли текущий пользователь удалить себя
    if (userIds.includes(currentUserId)) {
        return res.status(403).send('Нельзя удалить самого себя.');
    }

    const query = 'DELETE FROM users WHERE id IN (?)';
    db.query(query, [userIds], (err, result) => {
        if (err) return res.status(500).send('Ошибка сервера при удалении пользователей.');

        // Если пользователь удалил других, но сам себя не удалил, возвращаем успех
        res.status(200).send({ message: 'Пользователи удалены!' });
    });
});

// Маршрут для получения статуса текущего пользователя
app.get('/api/user/status', authenticateJWT, (req, res) => {
    const query = 'SELECT status FROM users WHERE username = ?';
    db.query(query, [req.user.username], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).send('Ошибка при получении статуса пользователя.');
        }

        const userStatus = results[0].status;
        res.json(userStatus);
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
