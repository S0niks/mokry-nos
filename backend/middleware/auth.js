const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('Токен в middleware:', token);

  if (!token) {
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    console.log('Декодированный токен:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Ошибка верификации токена:', err);
    return res.status(401).json({ message: 'Неверный токен' });
  }
};

const restrictTo = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: `Доступ запрещен. Требуется роль: ${role}` });
  }
  next();
};

module.exports = { authenticate, restrictTo };