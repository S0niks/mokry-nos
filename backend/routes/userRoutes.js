const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

console.log('userController:', userController); // Отладка
console.log('authMiddleware:', authMiddleware); // Отладка

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authMiddleware.authenticate, userController.getProfile);
router.get('/volunteers', authMiddleware.authenticate, authMiddleware.restrictTo('admin'), userController.getAllVolunteers);
router.put('/role/:id', authMiddleware.authenticate, authMiddleware.restrictTo('admin'), userController.updateRole);
router.post('/avatar', authMiddleware.authenticate, userController.updateAvatar);

module.exports = router;