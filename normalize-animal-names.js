const db = require('./backend/config/db');

db.all(`SELECT * FROM animals`, (err, animals) => {
  if (err) {
    console.error('Ошибка получения животных:', err);
    return;
  }

  animals.forEach(animal => {
    const normalizedName = animal.name.toLocaleLowerCase('ru-RU');
    db.run(
      `UPDATE animals SET name = ? WHERE id = ?`,
      [normalizedName, animal.id],
      (err) => {
        if (err) {
          console.error(`Ошибка обновления имени животного ${animal.id}:`, err);
        } else {
          console.log(`Имя животного ${animal.id} обновлено на ${normalizedName}`);
        }
      }
    );
  });

  db.close();
});