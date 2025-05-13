const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../frontend/images/avatars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения (jpeg, jpg, png) разрешены!'));
    }
  },
}).single('avatar');

const register = async (req, res) => {
  const { email, phone, name, password } = req.body;
  if (!email || !phone || !name || !password) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }
  if (!phone.startsWith('+7') || phone.length !== 12) {
    return res.status(400).json({ message: 'Номер телефона должен начинаться с +7 и содержать 10 цифр' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (email, phone, name, password, role) VALUES (?, ?, ?, ?, ?)`,
    [email, phone, name, hashedPassword, 'volunteer'],
    function (err) {
      if (err) {
        console.error('Ошибка регистрации:', err);
        return res.status(400).json({ message: 'Ошибка регистрации. Возможно, email уже используется.' });
      }
      res.status(201).json({ message: 'Регистрация успешна' });
    }
  );
};

const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email и пароль обязательны' });
  }
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    if (!user) return res.status(400).json({ message: 'Неверный email или пароль' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Неверный email или пароль' });
    const token = jwt.sign({ id: user.id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token, role: user.role });
  });
};

const getProfile = (req, res) => {
  const userId = req.user.id;
  console.log(`Запрос /api/users/profile, пользователь:`, req.user);
  db.get(`SELECT id, email, phone, name, role, avatar FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    console.log('Найденный пользователь:', user);
    res.json(user);
  });
};

const getAllVolunteers = (req, res) => {
  db.all(`SELECT id, email, phone, name, role FROM users WHERE role = 'volunteer'`, [], (err, users) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    res.json(users);
  });
};

const updateRole = (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin', 'volunteer'].includes(role)) {
    return res.status(400).json({ message: 'Недопустимая роль' });
  }
  db.run(
    `UPDATE users SET role = ? WHERE id = ?`,
    [role, id],
    function (err) {
      if (err) return res.status(500).json({ message: 'Ошибка сервера' });
      if (this.changes === 0) return res.status(404).json({ message: 'Пользователь не найден' });
      res.json({ message: 'Роль обновлена' });
    }
  );
};

const updateAvatar = (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    const userId = req.user.id;
    const avatar = req.file ? `/images/avatars/${req.file.filename}` : null;
    if (!avatar) return res.status(400).json({ message: 'Файл не загружен' });
    db.get(`SELECT avatar FROM users WHERE id = ?`, [userId], (err, row) => {
      if (err) return res.status(500).json({ message: 'Ошибка сервера' });
      if (row.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../frontend', row.avatar);
        fs.unlink(oldAvatarPath, (unlinkErr) => {
          if (unlinkErr) console.error('Ошибка удаления старого аватара:', unlinkErr);
        });
      }
      db.run(
        `UPDATE users SET avatar = ? WHERE id = ?`,
        [avatar, userId],
        function (err) {
          if (err) return res.status(500).json({ message: 'Ошибка сервера' });
          res.json({ message: 'Аватар обновлен', avatar });
        }
      );
    });
  });
};

module.exports = { register, login, getProfile, getAllVolunteers, updateRole, updateAvatar };