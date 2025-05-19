const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка Multer для сохранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../frontend/images');
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
    const filetypes = /jpeg|jpg|png|mp4/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения (jpeg, jpg, png) и видео (mp4) разрешены!'));
    }
  },
}).single('media');

const getAllNews = (req, res) => {
  db.all(`SELECT * FROM news ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json(rows);
  });
};

const getNewsById = (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM news WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Ошибка базы данных:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }
    res.json(row);
  });
};

const addNews = (req, res) => {
  upload(req, res, (err) => {
    console.log('Multer error:', err);
    if (err) {
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    }

    const { text } = req.body;
    console.log('Полученные данные:', { text, file: req.file });

    if (!text) {
      return res.status(400).json({ message: 'Текст новости обязателен' });
    }

    const media = req.file ? `/images/${req.file.filename}` : null;
    const created_at = new Date().toISOString();
    db.run(
      `INSERT INTO news (text, media, created_at) VALUES (?, ?, ?)`,
      [text, media, created_at],
      function (err) {
        console.log('SQL error:', err);
        if (err) {
          console.error('Ошибка при вставке в базу:', err);
          return res.status(400).json({ message: 'Ошибка добавления новости', error: err.message });
        }
        res.status(201).json({ id: this.lastID, text, media, created_at });
      }
    );
  });
};

const updateNews = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    }

    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Текст новости обязателен' });
    }

    db.get(`SELECT media FROM news WHERE id = ?`, [id], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      if (!row) {
        return res.status(404).json({ message: 'Новость не найдена' });
      }

      const oldMedia = row.media;
      const media = req.file ? `/images/${req.file.filename}` : req.body.media || null;
      const updated_at = new Date().toISOString();

      db.run(
        `UPDATE news SET text = ?, media = ?, updated_at = ? WHERE id = ?`,
        [text, media, updated_at, id],
        function (err) {
          if (err) {
            console.error('Ошибка при обновлении:', err);
            return res.status(400).json({ message: 'Ошибка обновления новости', error: err.message });
          }
          if (this.changes === 0) {
            return res.status(404).json({ message: 'Новость не найдена' });
          }

          if (req.file && oldMedia) {
            const oldFilePath = path.join(__dirname, '../../frontend', oldMedia);
            fs.unlink(oldFilePath, (unlinkErr) => {
              if (unlinkErr) console.error('Ошибка удаления старого файла:', unlinkErr);
            });
          }

          res.json({ message: 'Новость обновлена' });
        }
      );
    });
  });
};

const deleteNews = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT media FROM news WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }

    const media = row.media;
    db.run(`DELETE FROM news WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error('Ошибка при удалении:', err);
        return res.status(400).json({ message: 'Ошибка удаления новости', error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Новость не найдена' });
      }

      if (media) {
        const filePath = path.join(__dirname, '../../frontend', media);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Ошибка удаления файла:', unlinkErr);
        });
      }

      res.json({ message: 'Новость удалена' });
    });
  });
};

module.exports = { getAllNews, getNewsById, addNews, updateNews, deleteNews };