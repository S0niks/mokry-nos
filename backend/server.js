console.log('Файл server.js начал выполняться');
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use((req, res, next) => {
  console.log(`Запрос: ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`Отправляется ответ: ${body}`);
    originalSend.call(this, body);
  };
  next();
});

// Подключение маршрутов
console.log('Подключение маршрутов...');
const userRoutes = require('./routes/userRoutes');
const animalRoutes = require('./routes/animalRoutes');
const newsRoutes = require('./routes/newsRoutes');
const eventRoutes = require('./routes/eventRoutes');

app.use('/api/users', userRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventRoutes);

// Статические файлы после API-маршрутов
app.use(express.static(path.join(__dirname, '../frontend'), { index: false }));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

app.get('/', (req, res) => {
  console.log('Обработка запроса на /');
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});