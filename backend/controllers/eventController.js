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

const getAllEvents = (req, res) => {
  db.all(`SELECT * FROM events ORDER BY event_date ASC`, [], (err, rows) => {
    if (err) {
      console.error('Ошибка базы данных:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json(rows);
  });
};

const getEventById = (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM events WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error('Ошибка базы данных:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }
    res.json(row);
  });
};

const addEvent = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    }

    const { title, description, event_date } = req.body;
    if (!title || !description || !event_date) {
      return res.status(400).json({ message: 'Заголовок, описание и дата обязательны' });
    }

    const media = req.file ? `/images/${req.file.filename}` : null;
    const created_at = new Date().toISOString();
    db.run(
      `INSERT INTO events (title, description, event_date, media, created_at) VALUES (?, ?, ?, ?, ?)`,
      [title, description, event_date, media, created_at],
      function (err) {
        if (err) {
          console.error('Ошибка при вставке:', err);
          return res.status(400).json({ message: 'Ошибка добавления мероприятия', error: err.message });
        }
        res.status(201).json({ id: this.lastID, title, description, event_date, media, created_at });
      }
    );
  });
};

const updateEvent = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    }

    const { id } = req.params;
    const { title, description, event_date } = req.body;

    if (!title || !description || !event_date) {
      return res.status(400).json({ message: 'Заголовок, описание и дата обязательны' });
    }

    db.get(`SELECT media FROM events WHERE id = ?`, [id], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      if (!row) {
        return res.status(404).json({ message: 'Мероприятие не найдено' });
      }

      const oldMedia = row.media;
      const media = req.file ? `/images/${req.file.filename}` : req.body.media || null;
      const updated_at = new Date().toISOString();

      db.run(
        `UPDATE events SET title = ?, description = ?, event_date = ?, media = ?, updated_at = ? WHERE id = ?`,
        [title, description, event_date, media, updated_at, id],
        function (err) {
          if (err) {
            console.error('Ошибка при обновлении:', err);
            return res.status(400).json({ message: 'Ошибка обновления мероприятия', error: err.message });
          }
          if (this.changes === 0) {
            return res.status(404).json({ message: 'Мероприятие не найдено' });
          }

          if (req.file && oldMedia) {
            const oldFilePath = path.join(__dirname, '../../frontend', oldMedia);
            fs.unlink(oldFilePath, (unlinkErr) => {
              if (unlinkErr) console.error('Ошибка удаления старого файла:', unlinkErr);
            });
          }

          res.json({ message: 'Мероприятие обновлено' });
        }
      );
    });
  });
};

const deleteEvent = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT media FROM events WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }

    const media = row.media;
    db.run(`DELETE FROM events WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error('Ошибка при удалении:', err);
        return res.status(400).json({ message: 'Ошибка удаления мероприятия', error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Мероприятие не найдено' });
      }

      if (media) {
        const filePath = path.join(__dirname, '../../frontend', media);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) console.error('Ошибка удаления файла:', unlinkErr);
        });
      }

      res.json({ message: 'Мероприятие удалено' });
    });
  });
};

const toggleEventLike = (req, res) => {
  const { event_id } = req.params;
  const user_id = req.user.id; // Из middleware authenticate
  const created_at = new Date().toISOString();

  db.get(`SELECT * FROM user_events WHERE user_id = ? AND event_id = ?`, [user_id, event_id], (err, row) => {
    if (err) {
      console.error('Ошибка базы данных:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }

    if (row) {
      // Удалить лайк
      db.run(`DELETE FROM user_events WHERE user_id = ? AND event_id = ?`, [user_id, event_id], function (err) {
        if (err) {
          console.error('Ошибка при удалении лайка:', err);
          return res.status(400).json({ message: 'Ошибка удаления лайка' });
        }
        res.json({ message: 'Лайк удален' });
      });
    } else {
      // Добавить лайк
      db.run(
        `INSERT INTO user_events (user_id, event_id, created_at) VALUES (?, ?, ?)`,
        [user_id, event_id, created_at],
        function (err) {
          if (err) {
            console.error('Ошибка при добавлении лайка:', err);
            return res.status(400).json({ message: 'Ошибка добавления лайка' });
          }
          res.json({ message: 'Лайк добавлен' });
        }
      );
    }
  });
};

const getUserEvents = (req, res) => {
  const user_id = req.user.id;
  db.all(
    `SELECT e.* FROM events e
     JOIN user_events ue ON e.id = ue.event_id
     WHERE ue.user_id = ?
     ORDER BY e.event_date ASC`,
    [user_id],
    (err, rows) => {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
      res.json(rows);
    }
  );
};

module.exports = {
  getAllEvents,
  getEventById,
  addEvent,
  updateEvent,
  deleteEvent,
  toggleEventLike,
  getUserEvents,
};