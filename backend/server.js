console.log('Файл server.js начал выполняться');
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Запрос: ${req.method} ${req.url}`);
  next();
});

app.use(express.static(path.join(__dirname, '../frontend'), {
  index: false
}));

// Маршруты API
const userRoutes = require('./routes/userRoutes');
const animalRoutes = require('./routes/animalRoutes');
app.use('/api/users', userRoutes);
app.use('/api/animals', animalRoutes);

// Временный маршрут для новостей
app.get('/api/news', (req, res) => {
  res.json([
    { id: 1, title: 'Тестовая новость', content: 'Это пример', created_at: new Date().toISOString() }
  ]);
});

app.get('/', (req, res) => {
  console.log('Обработка запроса на /');
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`Отправляется ответ: ${body}`);
    originalSend.call(this, body);
  };
  next();
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});