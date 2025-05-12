const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Токен в middleware:', token);
  if (!token) {
    console.log('Токен отсутствует');
    return res.status(401).json({ message: 'Требуется аутентификация' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    console.log('Декодированный токен:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Ошибка верификации токена:', err);
    return res.status(401).json({ message: 'Недействительный токен' });
  }
};

const restrictTo = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Доступ запрещен: недостаточно прав' });
    }
    next();
  };
};

module.exports = { authenticate, restrictTo };