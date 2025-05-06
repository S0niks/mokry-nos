console.log('Файл server.js начал выполняться');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Отладка всех запросов
app.use((req, res, next) => {
  console.log(`Запрос: ${req.method} ${req.url}`);
  next();
});

// Проверяем статические файлы
app.use(express.static(path.join(__dirname, '../frontend'), {
  index: false // Отключаем автоматическую отправку index.html
}));

// Явно обслуживаем index.html
app.get('/', (req, res) => {
  console.log('Обработка запроса на /');
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Отладка всех ответов
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`Отправляется ответ: ${body}`);
    originalSend.call(this, body);
  };
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});