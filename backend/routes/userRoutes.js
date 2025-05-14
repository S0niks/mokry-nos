const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Простая авторизация с токеном (для демонстрации)
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key'; // Замени на безопасный ключ в продакшене

const uploadDir = path.join(__dirname, '../../uploads/users');

// Middleware для обработки загрузки файлов
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Ограничение 5 МБ
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения формата JPEG/PNG разрешены!'));
    }
  }
});

// Вход в систему
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Введите email и пароль' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Генерация токена
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Вход успешен', token });
  });
});

// Регистрация пользователя
router.post('/register', upload.single('avatar'), async (req, res) => {
  const { email, phone, password, name, role } = req.body;
  const avatar = req.file ? `/uploads/users/${req.file.filename}` : null;

  if (!email || !phone || !password || !name || !role) {
    return res.status(400).json({ message: 'Заполните все поля!' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (email, phone, password, name, role, avatar) VALUES (?, ?, ?, ?, ?, ?)`,
    [email, phone, hashedPassword, name, role, avatar],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка регистрации', error: err.message });
      }
      res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
    }
  );
});

// Получить профиль
router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    db.get(`SELECT id, email, phone, name, role, avatar FROM users WHERE id = ?`, [userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
      res.json(user);
    });
  } catch (err) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
});

// Обновить профиль
router.put('/profile', upload.single('avatar'), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Токен не предоставлен' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const { email, phone, password, name, role } = req.body;
    const avatar = req.file ? `/uploads/users/${req.file.filename}` : null;

    const updates = [];
    const params = [];
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (avatar) {
      updates.push('avatar = ?');
      params.push(avatar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Нечего обновлять' });
    }

    db.get(`SELECT avatar FROM users WHERE id = ?`, [userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      db.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        [...params, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ message: 'Ошибка обновления профиля', error: err.message });
          }
          if (avatar && user.avatar) {
            fs.unlink(path.join(uploadDir, path.basename(user.avatar)), (err) => {
              if (err) console.error('Ошибка удаления старого аватара:', err);
            });
          }
          res.json({ message: 'Профиль успешно обновлен' });
        }
      );
    });
  } catch (err) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
});

module.exports = router;