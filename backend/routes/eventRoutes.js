const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, restrictTo } = require('../middleware/auth');

router.get('/', eventController.getEvents);
router.post('/', authenticate, restrictTo('admin'), eventController.createEvent);
router.post('/register', authenticate, restrictTo('volunteer'), eventController.registerForEvent);
router.get('/my-events', authenticate, restrictTo('volunteer'), eventController.getUserEvents);

module.exports = router;