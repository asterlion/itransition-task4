import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment-timezone'; // Импортируем библиотеку
import './UsersTable.css';

const UsersTable = ({ isAuthenticated }) => {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(() => {
        if (isAuthenticated) {
            const loadUsers = async () => {
                await fetchUsers();
            };

            loadUsers();
        }
    }, [isAuthenticated]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log('Полученные пользователи:', response.data);
            setUsers(response.data);
        } catch (error) {
            console.error('Ошибка получения пользователей:', error);
        }
    };

    const handleSelectUser = (id) => {
        setSelectedUsers((prevSelected) =>
            prevSelected.includes(id)
                ? prevSelected.filter((userId) => userId !== id)
                : [...prevSelected, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map((user) => user.id));
        }
    };

    const blockUsers = async () => {
        try {
            await axios.post('/api/block', { userIds: selectedUsers }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            await fetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            console.error('Ошибка при блокировке пользователей:', error);
        }
    };

    const unblockUsers = async () => {
        try {
            await axios.post('/api/unblock', { userIds: selectedUsers }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            await fetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            console.error('Ошибка при разблокировке пользователей:', error);
        }
    };

    const deleteUsers = async () => {
        try {
            await axios.post('/api/delete', { userIds: selectedUsers }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            await fetchUsers();
            setSelectedUsers([]);
        } catch (error) {
            console.error('Ошибка при удалении пользователей:', error);
        }
    };

    const formatDate = (date) => {
        return moment(date).tz('Europe/Minsk').format('YYYY-MM-DD HH:mm:ss'); // Преобразуем дату в Минское время
    };

    return (
        <div className="users-table">
            <h2>Список пользователей</h2>
            {isAuthenticated ? (
                <>
                    <div className="toolbar">
                        <button onClick={blockUsers} disabled={selectedUsers.length === 0}>
                            Block
                        </button>
                        <button onClick={unblockUsers} disabled={selectedUsers.length === 0}>
                            Unblock
                        </button>
                        <button onClick={deleteUsers} disabled={selectedUsers.length === 0}>
                            Delete
                        </button>
                    </div>
                    <table>
                        <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === users.length}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th>Имя</th>
                            <th>Email</th>
                            <th>Дата регистрации</th>
                            <th>Последний вход</th>
                            <th>Статус</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                className={
                                    user.status === 'active' ? 'table-row-active' :
                                        user.status === 'blocked' ? 'table-row-blocked' : ''
                                }
                            >
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => handleSelectUser(user.id)}
                                    />
                                </td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{formatDate(user.registration_date)}</td> {/* Форматируем дату */}
                                <td>{formatDate(user.last_login)}</td> {/* Форматируем дату */}
                                <td>{user.status}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </>
            ) : (
                <p>Пожалуйста, войдите, чтобы просмотреть пользователей.</p>
            )}
        </div>
    );
};

export default UsersTable;
