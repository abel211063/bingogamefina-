const express = require('express');
const router = express.Router();
const { getGameState, submitBet, drawNumber, resetGame } = require('../controllers/gameController');
const { loginUser } = require('../controllers/authController');

// Auth Routes
router.post('/login', loginUser);

// Game Routes
router.get('/game', getGameState);
router.post('/bet', submitBet);
router.post('/draw', drawNumber);
router.post('/reset', resetGame);

module.exports = router;