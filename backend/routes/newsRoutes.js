const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const uploadDir = path.join(__dirname, '../../uploads/news');

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
  limits: { fileSize: 50 * 1024 * 1024 }, // Ограничение 50 МБ
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|mp4/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Разрешены только изображения (JPEG/PNG) и видео (MP4)!'));
    }
  }
});

// Добавить новость
router.post('/', upload.single('media'), async (req, res) => {
  const { text } = req.body;
  let media = req.file ? `/uploads/news/${req.file.filename}` : null;
  const mediaType = req.file ? req.file.mimetype : null;

  if (!text) {
    if (req.file) fs.unlinkSync(path.join(uploadDir, req.file.filename));
    return res.status(400).json({ message: 'Заполните поле текста!' });
  }

  if (req.file && req.file.mimetype.startsWith('image/')) {
    const compressedPath = path.join(uploadDir, `compressed-${req.file.filename}`);
    await sharp(req.file.path)
      .resize({ width: 800 })
      .toFile(compressedPath);
    fs.unlinkSync(req.file.path);
    media = `/uploads/news/compressed-${req.file.filename}`;
  }

  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;
  db.run(
    `INSERT INTO news (text, media, media_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [text, media, mediaType, createdAt, updatedAt],
    function(err) {
      if (err) {
        if (media) fs.unlinkSync(path.join(uploadDir, path.basename(media)));
        return res.status(500).json({ message: 'Ошибка добавления новости', error: err.message });
      }
      res.status(201).json({ message: 'Новость успешно добавлена', id: this.lastID });
    }
  );
});

// Получить все новости
router.get('/', (req, res) => {
  db.all(
    `SELECT * FROM news WHERE archived = 0`,
    [],
    (err, news) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка получения новостей', error: err.message });
      }
      res.json(news);
    }
  );
});

// Обновить новость
router.put('/:id', upload.single('media'), async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  let media = req.file ? `/uploads/news/${req.file.filename}` : null;
  const mediaType = req.file ? req.file.mimetype : null;

  if (!text) {
    if (req.file) fs.unlinkSync(path.join(uploadDir, req.file.filename));
    return res.status(400).json({ message: 'Заполните поле текста!' });
  }

  const updatedAt = new Date().toISOString();
  db.get(`SELECT media FROM news WHERE id = ?`, [id], (err, newsItem) => {
    if (err || !newsItem) {
      if (req.file) fs.unlinkSync(path.join(uploadDir, req.file.filename));
      return res.status(404).json({ message: 'Новость не найдена' });
    }

    if (req.file && req.file.mimetype.startsWith('image/')) {
      const compressedPath = path.join(uploadDir, `compressed-${req.file.filename}`);
      sharp(req.file.path)
        .resize({ width: 800 })
        .toFile(compressedPath)
        .then(() => fs.unlinkSync(req.file.path));
      media = `/uploads/news/compressed-${req.file.filename}`;
    }

    db.run(
      `UPDATE news SET text = ?, media = ?, media_type = ?, updated_at = ? WHERE id = ?`,
      [text, media || newsItem.media, mediaType || newsItem.media_type, updatedAt, id],
      (err) => {
        if (err) {
          if (media) fs.unlinkSync(path.join(uploadDir, path.basename(media)));
          return res.status(500).json({ message: 'Ошибка обновления новости', error: err.message });
        }
        if (media && newsItem.media) {
          fs.unlink(path.join(uploadDir, path.basename(newsItem.media)), (err) => {
            if (err) console.error('Ошибка удаления старого медиа:', err);
          });
        }
        res.json({ message: 'Новость успешно обновлена' });
      }
    );
  });
});

// Удалить новость
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT media FROM news WHERE id = ?`, [id], (err, newsItem) => {
    if (err || !newsItem) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }

    db.run(`DELETE FROM news WHERE id = ?`, [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка удаления новости', error: err.message });
      }
      if (newsItem.media) {
        fs.unlink(path.join(uploadDir, path.basename(newsItem.media)), (err) => {
          if (err) console.error('Ошибка удаления медиа:', err);
        });
      }
      res.json({ message: 'Новость успешно удалена' });
    });
  });
});

module.exports = router;