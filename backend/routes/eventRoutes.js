const express = require('express');
const router = express.Router();
const { authenticate, restrictTo } = require('../middleware/auth');
const {
  getAllEvents,
  getEventById,
  addEvent,
  updateEvent,
  deleteEvent,
  toggleEventLike,
  getUserEvents,
} = require('../controllers/eventController');

console.log('Регистрация маршрутов событий...');

router.get('/', getAllEvents);
router.get('/user', authenticate, (req, res, next) => {
  console.log('Запрос к /api/events/user получен');
  getUserEvents(req, res, next);
});
router.get('/:id', getEventById);
router.post('/', authenticate, restrictTo('admin'), addEvent);
router.put('/:id', authenticate, restrictTo('admin'), updateEvent);
router.delete('/:id', authenticate, restrictTo('admin'), deleteEvent);
router.post('/:event_id/like', authenticate, toggleEventLike);

module.exports = router;