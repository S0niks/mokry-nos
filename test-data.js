const db = require('./backend/config/db');
const bcrypt = require('bcryptjs');

async function insertTestData() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  db.run(
    `INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
    ['admin@wetnose.ru', hashedPassword, 'Админ', 'admin'],
    (err) => {
      if (err) {
        console.error('Ошибка:', err);
      } else {
        console.log('Пользователь добавлен');
      }
    }
  );
  db.run(
    `INSERT INTO animals (name, species, gender, description, status, image) VALUES (?, ?, ?, ?, ?, ?)`,
    ['Барсик', 'cat', 'male', 'Добрый кот', 'available', '/images/barsik.jpg'],
    (err) => {
      if (err) {
        console.error('Ошибка:', err);
      } else {
        console.log('Животное добавлено');
      }
    }
  );
  db.close();
}

insertTestData();