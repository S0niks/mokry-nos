const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware.authenticate, authMiddleware.restrictTo('admin'), animalController.addAnimal);
router.get('/', animalController.getAnimals);
router.get('/:id', animalController.getAnimalById);
router.put('/:id', authMiddleware.authenticate, authMiddleware.restrictTo('admin'), animalController.updateAnimal);
router.delete('/:id', authMiddleware.authenticate, authMiddleware.restrictTo('admin'), animalController.deleteAnimal);

module.exports = router;