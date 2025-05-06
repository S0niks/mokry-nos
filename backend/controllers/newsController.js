const db = require('../config/db');

exports.createNews = (req, res) => {
  const { title, content } = req.body;
  const created_at = new Date().toISOString();
  db.run(
    `INSERT INTO news (title, content, created_at) VALUES (?, ?, ?)`,
    [title, content, created_at],
    function (err) {
      if (err) {
        return res.status(400).json({ message: 'Ошибка создания новости' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
};

exports.getNews = (req, res) => {
  db.all(`SELECT * FROM news ORDER BY created_at DESC`, (err, news) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка базы данных' });
    }
    res.json(news);
  });
};