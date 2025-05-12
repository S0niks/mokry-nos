const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/wetnose.db');
console.log('Попытка подключения к базе данных:', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
  } else {
    console.log('Подключено к базе данных SQLite');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'volunteer', 'guest'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS animals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      species TEXT NOT NULL CHECK(species IN ('cat', 'dog')),
      gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
      description TEXT,
      status TEXT NOT NULL,
      image TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      media TEXT, -- URL фото или видео
      created_at TEXT NOT NULL, -- Дата и время в формате ISO
      updated_at TEXT
    )
  `);
});

module.exports = db;