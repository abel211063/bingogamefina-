const game = require('../models/Game');

const getGameState = (req, res) => {
  res.status(200).json(game.getState());
};

const submitBet = (req, res) => {
  const { ticketId, numbers } = req.body;
  if (!ticketId || !Array.isArray(numbers)) {
    return res.status(400).json({ message: 'Invalid bet data.' });
  }
  const result = game.submitBet(ticketId, numbers);
  res.status(201).json({ message: `Bet ${ticketId} submitted.`, ...result });
};

const drawNumber = (req, res) => {
  const newNumber = game.drawNumber();
  if (!newNumber) {
    return res.status(400).json({ message: "Game over." });
  }
  res.status(200).json({
    message: `Drew number: ${newNumber}`,
    gameState: game.getState(),
  });
};

const resetGame = (req, res) => {
  game.reset();
  res.status(200).json({
    message: 'Game has been reset.',
    gameState: game.getState(),
  });
};

module.exports = { getGameState, submitBet, drawNumber, resetGame };