const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/wetnose.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
    if (err.code === 'SQLITE_CANTOPEN') {
      console.log('Попытка создать базу данных...');
      new sqlite3.Database(dbPath, (createErr) => {
        if (createErr) {
          console.error('Ошибка создания базы данных:', createErr.message);
        } else {
          console.log('База данных создана. Перезапустите скрипт.');
        }
      });
    }
  } else {
    console.log('Подключено к базе данных');
  }
});

db.all(`SELECT * FROM news`, [], (err, rows) => {
  if (err) {
    console.error('Ошибка:', err);
  } else {
    console.log('Новости:', rows);
  }
  db.close();
});