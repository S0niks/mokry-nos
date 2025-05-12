const express = require('express');
const router = express.Router();
const { authenticate, restrictTo } = require('../middleware/auth');
const { addAnimal, getAllAnimals } = require('../controllers/animalController');

router.get('/', getAllAnimals);
router.post('/', authenticate, restrictTo('admin'), addAnimal);

module.exports = router;