const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
  const { email, password, name, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
    [email, hashedPassword, name, role || 'guest'],
    function (err) {
      if (err) {
        return res.status(400).json({ message: 'Пользователь уже существует' });
      }
      const token = jwt.sign({ id: this.lastID, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '1h',
      });
      res.status(201).json({ token });
    }
  );
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '1h',
    });
    res.json({ token });
  });
};

exports.getProfile = (req, res) => {
  db.get(`SELECT id, email, name, role FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  });
};