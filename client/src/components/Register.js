import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function Register({ onLogin }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();
        console.log(data);

        if (data.success) {
            onLogin(formData.username); // Передаем имя пользователя в родительский компонент
        }
    };

    return (
        <form className="d-flex flex-column gap-2" onSubmit={handleSubmit}>
            <input
                type="text"
                className="form-control"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
            />
            <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
            />
            <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
            />
            <button type="submit" className="btn btn-primary">Register</button>
        </form>
    );
}

export default Register;
