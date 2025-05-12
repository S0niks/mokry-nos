const db = require('../config/db');

const getAllNews = (req, res) => {
  db.all(`SELECT * FROM news ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    res.json(rows);
  });
};

const addNews = (req, res) => {
  const { text, media } = req.body;
  console.log('Данные для добавления новости:', { text, media });

  if (!text) {
    return res.status(400).json({ message: 'Текст новости обязателен' });
  }

  const created_at = new Date().toISOString();
  db.run(
    `INSERT INTO news (text, media, created_at) VALUES (?, ?, ?)`,
    [text, media || null, created_at],
    function (err) {
      if (err) {
        console.error('Ошибка при вставке в базу:', err);
        return res.status(400).json({ message: 'Ошибка добавления новости', error: err.message });
      }
      res.status(201).json({ id: this.lastID, text, media, created_at });
    }
  );
};

const updateNews = (req, res) => {
  const { id } = req.params;
  const { text, media } = req.body;
  console.log('Данные для обновления новости:', { id, text, media });

  if (!text) {
    return res.status(400).json({ message: 'Текст новости обязателен' });
  }

  const updated_at = new Date().toISOString();
  db.run(
    `UPDATE news SET text = ?, media = ?, updated_at = ? WHERE id = ?`,
    [text, media || null, updated_at, id],
    function (err) {
      if (err) {
        console.error('Ошибка при обновлении:', err);
        return res.status(400).json({ message: 'Ошибка обновления новости', error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Новость не найдена' });
      }
      res.json({ message: 'Новость обновлена' });
    }
  );
};

const deleteNews = (req, res) => {
  const { id } = req.params;
  console.log('Удаление новости с ID:', id);
  db.run(`DELETE FROM news WHERE id = ?`, [id], function (err) {
    if (err) {
      console.error('Ошибка при удалении:', err);
      return res.status(400).json({ message: 'Ошибка удаления новости', error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Новость не найдена' });
    }
    res.json({ message: 'Новость удалена' });
  });
};

module.exports = { getAllNews, addNews, updateNews, deleteNews };