const express = require('express');
const router = express.Router();
const { register, login, getProfile, getAllVolunteers, updateRole, updateAvatar } = require('../controllers/userController');

// Вход в систему
router.post('/login', login);

// Регистрация пользователя
router.post('/register', register); 

// Получить профиль
router.get('/profile', getProfile);

// Получить всех волонтеров
router.get('/volunteers', getAllVolunteers);

// Обновить роль пользователя
router.put('/:id/role', updateRole);

// Обновить аватар
router.put('/avatar', updateAvatar);

module.exports = router;