const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const { authenticate, restrictTo } = require('../middleware/auth');

router.get('/', animalController.getAnimals);
router.post('/', authenticate, restrictTo('admin'), animalController.addAnimal);
router.put('/:id', authenticate, restrictTo('admin'), animalController.updateAnimal);
router.delete('/:id', authenticate, restrictTo('admin'), animalController.deleteAnimal);

module.exports = router;