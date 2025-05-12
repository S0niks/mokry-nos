const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database/wetnose.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
  } else {
    console.log('Подключено к базе данных');
  }
});

db.get("PRAGMA table_info(news)", [], (err, row) => {
  if (err) {
    console.error('Ошибка при проверке структуры таблицы:', err);
  } else if (!row) {
    console.log('Таблица news не существует или пуста');
  } else {
    console.log('Структура таблицы news:');
    db.all("PRAGMA table_info(news)", [], (err, rows) => {
      if (err) {
        console.error('Ошибка при выборке структуры:', err);
      } else {
        rows.forEach(row => console.log(`  ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''}`));
      }
      db.close();
    });
  }
});