const db = require('../config/db');

exports.createEvent = (req, res) => {
  const { title, description, date } = req.body;
  const created_by = req.user.id;
  db.run(
    `INSERT INTO events (title, description, date, created_by) VALUES (?, ?, ?, ?)`,
    [title, description, date, created_by],
    function (err) {
      if (err) {
        return res.status(400).json({ message: 'Ошибка создания мероприятия' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
};

exports.getEvents = (req, res) => {
  db.all(`SELECT * FROM events`, (err, events) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка базы данных' });
    }
    res.json(events);
  });
};

exports.registerForEvent = (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.id;
  db.run(
    `INSERT INTO event_registrations (user_id, event_id) VALUES (?, ?)`,
    [user_id, event_id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: 'Ошибка регистрации на мероприятие' });
      }
      res.status(201).json({ message: 'Зарегистрировано на мероприятие' });
    }
  );
};

exports.getUserEvents = (req, res) => {
  const user_id = req.user.id;
  db.all(
    `SELECT e.* FROM events e JOIN event_registrations er ON e.id = er.event_id WHERE er.user_id = ?`,
    [user_id],
    (err, events) => {
      if (err) {
        return res.status(500).json({ message: 'Ошибка базы данных' });
      }
      res.json(events);
    }
  );
};