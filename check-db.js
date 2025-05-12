const db = require('./backend/config/db');

db.all(`SELECT * FROM users`, [], (err, rows) => {
  if (err) {
    console.error('Ошибка:', err);
  } else {
    console.log('Пользователи:', rows);
  }
  db.close();
});