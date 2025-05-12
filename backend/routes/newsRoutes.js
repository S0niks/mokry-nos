const express = require('express');
const router = express.Router();
const { authenticate, restrictTo } = require('../middleware/auth');
const { getAllNews, addNews, updateNews, deleteNews } = require('../controllers/newsController');

router.get('/', getAllNews);
router.post('/', authenticate, restrictTo('admin'), addNews);
router.put('/:id', authenticate, restrictTo('admin'), updateNews);
router.delete('/:id', authenticate, restrictTo('admin'), deleteNews);

module.exports = router;