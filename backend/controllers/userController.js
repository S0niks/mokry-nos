const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const register = async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, name, role || 'guest'],
      function (err) {
        if (err) {
          return res.status(400).json({ message: 'Ошибка регистрации' });
        }
        res.status(201).json({ message: 'Пользователь зарегистрирован' });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });
};

const getProfile = (req, res) => {
  console.log('Запрос /api/users/profile, пользователь:', req.user);
  db.get(`SELECT id, email, name, role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) {
      console.log('Ошибка базы данных:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!user) {
      console.log('Пользователь не найден, ID:', req.user.id);
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    console.log('Найденный пользователь:', user);
    res.json(user);
  });
};

module.exports = { register, login, getProfile };