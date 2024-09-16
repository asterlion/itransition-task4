import React, { useState } from 'react';
import './App.css';
import UsersTable from './components/UsersTable'; // Импортируем компонент таблицы пользователей
import Register from './components/Register';
import Login from './components/Login';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Состояние для аутентификации пользователя
    const [userName, setUserName] = useState(''); // Состояние для имени пользователя

    // Обработчик входа пользователя
    const handleLogin = (name) => {
        setIsAuthenticated(true);
        setUserName(name);
    };

    // Обработчик выхода пользователя
    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserName('');
        localStorage.removeItem('token'); // Удаляем токен при выходе
    };

    return (
        <div className="App">
            <div className="header App-header">
                {isAuthenticated ? (
                    <div>
                        <span>Welcome, {userName}!</span>
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                ) : (
                    <div>
                        <Login onLogin={handleLogin} />
                        <Register onLogin={handleLogin} />
                    </div>
                )}
            </div>
            <div className="main-content">
                <UsersTable isAuthenticated={isAuthenticated} /> {/* Передаем состояние аутентификации */}
            </div>
        </div>
    );
}

export default App;
