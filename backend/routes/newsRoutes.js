const express = require('express');
const router = express.Router();
const { authenticate, restrictTo } = require('../middleware/auth');
const { getAllNews, getNewsById, addNews, updateNews, deleteNews } = require('../controllers/newsController');

router.get('/', getAllNews);
router.get('/:id', getNewsById); // Добавлен маршрут для получения новости по ID
router.post('/', authenticate, restrictTo('admin'), addNews);
router.put('/:id', authenticate, restrictTo('admin'), updateNews);
router.delete('/:id', authenticate, restrictTo('admin'), deleteNews);

module.exports = router;