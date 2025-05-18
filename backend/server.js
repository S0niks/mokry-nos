const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const db = require('./config/db');
const animalRoutes = require('./routes/animalRoutes');
const newsRoutes = require('./routes/newsRoutes');
const userRoutes = require('./routes/userRoutes');

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Слишком много запросов с вашего IP, попробуйте снова через 15 минут.',
});
app.use('/api/', limiter);

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`Получен запрос: ${req.method} ${req.url}`);
  next();
});

app.use('/uploads', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  res.set('Cache-Control', 'public, max-age=604800');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=604800');
  },
}));

app.use('/api/animals', animalRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/users', userRoutes);

// Раздача статических файлов фронтенда
app.use(express.static(path.join(__dirname, '../frontend')));

// Перенаправление корневого пути на pages/index.html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/pages/index.html');
  console.log(`Попытка отправить файл: ${indexPath}`);
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Файл pages/index.html не найден');
  }
});

// Обработка 404 для всех остальных путей
app.use((req, res) => {
  res.status(404).send(`Cannot ${req.method} ${req.url}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});