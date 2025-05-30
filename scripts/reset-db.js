const db = require('../backend/config/db');
const bcrypt = require('bcryptjs');

async function resetDB() {
  db.run(`DROP TABLE IF EXISTS users`, (err) => {
    if (err) console.error('Ошибка удаления таблицы users:', err);
    else console.log('Таблица users удалена');
  });

  db.run(`DROP TABLE IF EXISTS animals`, (err) => {
    if (err) console.error('Ошибка удаления таблицы animals:', err);
    else console.log('Таблица animals удалена');
  });

  db.run(`DROP TABLE IF EXISTS news`, (err) => {
    if (err) console.error('Ошибка удаления таблицы news:', err);
    else console.log('Таблица news удалена');
  });

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL CHECK(phone LIKE '+7%'),
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'volunteer')),
        avatar TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS animals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        species TEXT NOT NULL CHECK(species IN ('cat', 'dog')),
        gender TEXT NOT NULL CHECK(gender IN ('male', 'female')),
        description TEXT,
        status TEXT NOT NULL CHECK(status IN ('в поиске семьи', 'нашел семью', 'на лечение')),
        image TEXT,
        archived INTEGER DEFAULT 0,
        updated_at TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        media TEXT,
        media_type TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        archived INTEGER DEFAULT 0
      )
    `);
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);
  db.run(
    `INSERT INTO users (email, phone, password, name, role) VALUES (?, ?, ?, ?, ?)`,
    ['admin@wetnose.ru', '+79261234567', hashedPassword, 'Админ', 'admin'],
    (err) => {
      if (err) console.error('Ошибка добавления admin:', err);
      else console.log('Пользователь admin добавлен');
    }
  );

  const hashedVolunteerPassword = await bcrypt.hash('volunteer123', 10);
  db.run(
    `INSERT INTO users (email, phone, password, name, role) VALUES (?, ?, ?, ?, ?)`,
    ['volunteer@wetnose.ru', '+79261234568', hashedVolunteerPassword, 'Волонтер', 'volunteer'],
    (err) => {
      if (err) console.error('Ошибка добавления volunteer:', err);
      else console.log('Пользователь volunteer добавлен');
    }
  );

  db.close();
}

resetDB();