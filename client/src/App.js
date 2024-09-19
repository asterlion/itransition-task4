import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import UsersTable from './components/UsersTable';
import Register from './components/Register';
import Login from './components/Login';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState('');

    const handleLogin = (name) => {
        setIsAuthenticated(true);
        setUserName(name);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserName('');
        localStorage.removeItem('token');
        window.location.href = '/'; // Перенаправление на главную страницу
    };

    return (
        <div className="container">
            <header className="d-flex justify-content-between align-items-center py-3">
                {isAuthenticated ? (
                    <div className="d-flex align-items-center">
                        <span className="me-3">Welcome, {userName}!</span>
                        <button className="btn btn-outline-danger" onClick={handleLogout}>Logout</button>
                    </div>
                ) : (
                    <div className="d-flex justify-content-between w-100">
                        <div className="me-auto">
                            <Login onLogin={handleLogin} />
                        </div>
                        <div className="ms-auto">
                            <Register onLogin={handleLogin} />
                        </div>
                    </div>
                )}
            </header>
            <main className="mt-4">
                <UsersTable isAuthenticated={isAuthenticated} onLogout={handleLogout} />
            </main>
        </div>
    );
}

export default App;
