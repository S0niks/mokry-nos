const db = require('../config/db');

const addAnimal = (req, res) => {
  const { name, species, gender, description, status, image } = req.body;
  db.run(
    `INSERT INTO animals (name, species, gender, description, status, image) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, species, gender, description, status, image],
    function (err) {
      if (err) {
        return res.status(400).json({ message: 'Ошибка добавления животного' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
};

const getAllAnimals = (req, res) => {
  db.all(`SELECT * FROM animals`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json(rows);
  });
};

module.exports = { addAnimal, getAllAnimals };