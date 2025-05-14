const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

const db = require('./config/db'); // Подключение к базе
const animalRoutes = require('./routes/animalRoutes');
const newsRoutes = require('./routes/newsRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/animals', animalRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes); 

app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});