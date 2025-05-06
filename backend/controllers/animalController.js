const db = require('../config/db');

exports.getAnimals = (req, res) => {
  const { species, gender } = req.query;
  let query = `SELECT * FROM animals`;
  const params = [];

  if (species || gender) {
    query += ` WHERE `;
    if (species) {
      query += `species = ?`;
      params.push(species);
    }
    if (gender) {
      query += species ? ` AND gender = ?` : `gender = ?`;
      params.push(gender);
    }
  }

  db.all(query, params, (err, animals) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка базы данных' });
    }
    res.json(animals);
  });
};

exports.addAnimal = (req, res) => {
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

exports.updateAnimal = (req, res) => {
  const { id } = req.params;
  const { name, species, gender, description, status, image } = req.body;
  db.run(
    `UPDATE animals SET name = ?, species = ?, gender = ?, description = ?, status = ?, image = ? WHERE id = ?`,
    [name, species, gender, description, status, image, id],
    function (err) {
      if (err || this.changes === 0) {
        return res.status(404).json({ message: 'Животное не найдено' });
      }
      res.json({ message: 'Животное обновлено' });
    }
  );
};

exports.deleteAnimal = (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM animals WHERE id = ?`, [id], function (err) {
    if (err || this.changes === 0) {
      return res.status(404).json({ message: 'Животное не найдено' });
    }
    res.json({ message: 'Животное удалено' });
  });
};