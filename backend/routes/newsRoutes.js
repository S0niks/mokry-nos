const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticate, restrictTo } = require('../middleware/auth');

router.get('/', newsController.getNews);
router.post('/', authenticate, restrictTo('admin'), newsController.createNews);

module.exports = router;