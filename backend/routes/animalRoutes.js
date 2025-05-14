const express = require('express');
const router = express.Router();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const uploadDir = path.join(__dirname, '../../uploads/animals');

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

// Добавить животное
router.post('/', upload.single('image'), async (req, res) => {
  const { name, description, species, gender, status } = req.body;
  let image = req.file ? `/uploads/animals/${req.file.filename}` : null;

  if (!name || !description || !species || !gender || !status) {
    if (req.file) fs.unlinkSync(path.join(uploadDir, req.file.filename));
    return res.status(400).json({ message: 'Заполните все поля!' });
  }

  if (req.file) {
    const compressedPath = path.join(uploadDir, `compressed-${req.file.filename}`);
    await sharp(req.file.path)
      .resize({ width: 800 })
      .toFile(compressedPath);
    fs.unlinkSync(req.file.path);
    image = `/uploads/animals/compressed-${req.file.filename}`;
  }

  const updatedAt = new Date().toISOString();
  db.run(
    `INSERT INTO animals (name, species, gender, description, status, image, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name.toLocaleLowerCase('ru-RU'), species, gender, description, status, image, updatedAt],
    function(err) {
      if (err) {
        if (image) fs.unlinkSync(path.join(uploadDir, path.basename(image)));
        return res.status(500).json({ message: 'Ошибка добавления животного', error: err.message });
      }
      res.status(201).json({ message: 'Животное успешно добавлено', id: this.lastID });
    }
  );
});

// Получить все животных
router.get('/', (req, res) => {
  const name = req.query.name ? `%${req.query.name.toLocaleLowerCase('ru-RU')}%` : '%';
  db.all(
    `SELECT * FROM animals WHERE name LIKE ? AND archived = 0`,
    [name],
    (err, animals) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка получения животных', error: err.message });
      }
      res.json(animals);
    }
  );
});

// Обновить животное
router.put('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, description, species, gender, status } = req.body;
  let image = req.file ? `/uploads/animals/compressed-${req.file.filename}` : null;

  if (!name || !description || !species || !gender || !status) {
    if (req.file) fs.unlinkSync(path.join(uploadDir, req.file.filename));
    return res.status(400).json({ message: 'Заполните все поля!' });
  }

  const updatedAt = new Date().toISOString();
  db.get(`SELECT image FROM animals WHERE id = ?`, [id], (err, animal) => {
    if (err || !animal) {
      if (req.file) fs.unlinkSync(path.join(uploadDir, req.file.filename));
      return res.status(404).json({ message: 'Животное не найдено' });
    }

    if (req.file) {
      const compressedPath = path.join(uploadDir, `compressed-${req.file.filename}`);
      sharp(req.file.path)
        .resize({ width: 800 })
        .toFile(compressedPath)
        .then(() => fs.unlinkSync(req.file.path));
    }

    db.run(
      `UPDATE animals SET name = ?, species = ?, gender = ?, description = ?, status = ?, image = ?, updated_at = ? WHERE id = ?`,
      [name.toLocaleLowerCase('ru-RU'), species, gender, description, status, image || animal.image, updatedAt, id],
      (err) => {
        if (err) {
          if (image) fs.unlinkSync(path.join(uploadDir, path.basename(image)));
          return res.status(500).json({ message: 'Ошибка обновления животного', error: err.message });
        }
        if (image && animal.image) {
          fs.unlink(path.join(uploadDir, path.basename(animal.image)), (err) => {
            if (err) console.error('Ошибка удаления старого изображения:', err);
          });
        }
        res.json({ message: 'Животное успешно обновлено' });
      }
    );
  });
});

// Удалить животное
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT image FROM animals WHERE id = ?`, [id], (err, animal) => {
    if (err || !animal) {
      return res.status(404).json({ message: 'Животное не найдено' });
    }

    db.run(`DELETE FROM animals WHERE id = ?`, [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка удаления животного', error: err.message });
      }
      if (animal.image) {
        fs.unlink(path.join(uploadDir, path.basename(animal.image)), (err) => {
          if (err) console.error('Ошибка удаления изображения:', err);
        });
      }
      res.json({ message: 'Животное успешно удалено' });
    });
  });
});

module.exports = router;