const express = require('express');
const router = express.Router();
const animalController = require('../controllers/animalController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware.authenticate, animalController.addAnimal);
router.get('/', animalController.getAnimals);

module.exports = router;