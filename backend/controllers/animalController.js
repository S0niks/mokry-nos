const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../frontend/images/animals');
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
}).single('image');

const addAnimal = (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });

    const { name, description, species, gender, status } = req.body;
    const image = req.file ? `/images/animals/${req.file.filename}` : null;

    if (!name || !description || !species || !gender || !status) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    const normalizedName = name.toLocaleLowerCase('ru-RU');

    db.run(
      `INSERT INTO animals (name, species, gender, description, status, image) VALUES (?, ?, ?, ?, ?, ?)`,
      [normalizedName, species, gender, description, status, image],
      function (err) {
        if (err) {
          console.error('Ошибка добавления животного:', err);
          return res.status(500).json({ message: 'Ошибка добавления животного' });
        }
        res.status(201).json({ message: 'Животное добавлено', id: this.lastID });
      }
    );
  });
};

const getAnimals = (req, res) => {
  let query = 'SELECT * FROM animals';
  const params = [];
  const filters = {};

  if (req.query.species) filters.species = req.query.species.split(',');
  if (req.query.gender) filters.gender = req.query.gender.split(',');
  if (req.query.status) filters.status = req.query.status.split(',');
  if (req.query.name) {
    filters.name = req.query.name.toLocaleLowerCase('ru-RU').trim();
    console.log('Поисковая строка (нижний регистр):', filters.name);
  }

  const conditions = [];
  if (filters.species && filters.species.length) conditions.push(`species IN (${filters.species.map(() => '?').join(',')})`);
  if (filters.gender && filters.gender.length) conditions.push(`gender IN (${filters.gender.map(() => '?').join(',')})`);
  if (filters.status && filters.status.length) conditions.push(`status IN (${filters.status.map(() => '?').join(',')})`);
  if (filters.name) conditions.push(`name LIKE ?`);

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
    if (filters.species) params.push(...filters.species);
    if (filters.gender) params.push(...filters.gender);
    if (filters.status) params.push(...filters.status);
    if (filters.name) params.push(`%${filters.name}%`);
  }

  console.log('SQL Query:', query);
  console.log('Params:', params);

  db.all(query, params, (err, animals) => {
    if (err) {
      console.error('Ошибка выполнения запроса:', err);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    console.log('Найденные животные:', animals);
    res.json(animals);
  });
};

const getAnimalById = (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM animals WHERE id = ?`, [id], (err, animal) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    if (!animal) return res.status(404).json({ message: 'Животное не найдено' });
    res.json(animal);
  });
};

const updateAnimal = (req, res) => {
  upload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });

    const { id } = req.params;
    const { name, description, species, gender, status } = req.body;
    const image = req.file ? `/images/animals/${req.file.filename}` : null;

    if (!name || !description || !species || !gender || !status) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    const normalizedName = name.toLocaleLowerCase('ru-RU');

    db.get(`SELECT image FROM animals WHERE id = ?`, [id], (err, row) => {
      if (err) return res.status(500).json({ message: 'Ошибка сервера' });
      if (!row) return res.status(404).json({ message: 'Животное не найдено' });

      if (image && row.image) {
        const oldImagePath = path.join(__dirname, '../../frontend', row.image);
        fs.unlink(oldImagePath, (unlinkErr) => {
          if (unlinkErr) console.error('Ошибка удаления старого изображения:', unlinkErr);
        });
      }

      const updatedImage = image || row.image;
      db.run(
        `UPDATE animals SET name = ?, species = ?, gender = ?, description = ?, status = ?, image = ? WHERE id = ?`,
        [normalizedName, species, gender, description, status, updatedImage, id],
        function (err) {
          if (err) return res.status(500).json({ message: 'Ошибка сервера' });
          if (this.changes === 0) return res.status(404).json({ message: 'Животное не найдено' });
          res.json({ message: 'Животное обновлено' });
        }
      );
    });
  });
};

const deleteAnimal = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT image FROM animals WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Ошибка сервера' });
    if (!row) return res.status(404).json({ message: 'Животное не найдено' });

    if (row.image) {
      const imagePath = path.join(__dirname, '../../frontend', row.image);
      fs.unlink(imagePath, (unlinkErr) => {
        if (unlinkErr) console.error('Ошибка удаления изображения:', unlinkErr);
      });
    }

    db.run(`DELETE FROM animals WHERE id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ message: 'Ошибка сервера' });
      if (this.changes === 0) return res.status(404).json({ message: 'Животное не найдено' });
      res.json({ message: 'Животное удалено' });
    });
  });
};

module.exports = { addAnimal, getAnimals, getAnimalById, updateAnimal, deleteAnimal };