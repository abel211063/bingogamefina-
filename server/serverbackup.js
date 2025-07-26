require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// Middleware
app.use(cors()); // Enable CORS for all routes (important for frontend communication)
app.use(express.json()); // Body parser for JSON requests

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas and Models ---

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // For cashier summary, we can assume users have a balance or transaction history
  // For simplicity, we'll calculate on the fly for reports rather than store balances directly on user.
});

// Hash password before saving the user
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

const bingoCardSchema = new mongoose.Schema({
  slipId: { type: String, required: true, unique: true }, // The external ID for the card, e.g., '123'
  cardNumbers: { type: Object, required: true }, // e.g., { B: [1,2,3,4,5], I: [16,17,18,19,20], ... }
  // You might add an owner/player ID here if cards are pre-assigned or owned
});
const BingoCard = mongoose.model('BingoCard', bingoCardSchema);

const gameSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['idle', 'waiting_for_players', 'in_progress', 'ended'], default: 'idle' },
  betAmount: { type: Number, required: true },
  houseEdge: { type: Number, required: true },
  winningPattern: { type: String, required: true },
  drawnNumbers: [{ type: Number }], // Store only the numbers, lastCalledNumber can be derived
  lastCalledNumber: {
    number: Number,
    letter: String,
  },
  uncalledNumbers: [{ type: Number }], // All 75 numbers, shuffled, to be drawn from
  players: [{
    _id: false, // Don't create a separate _id for sub-document in this array
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String, // Denormalize for easy access
    slipId: String, // The user-facing ticket/slip ID
    bingoCard: { type: mongoose.Schema.Types.ObjectId, ref: 'BingoCard' }, // Reference to the actual bingo card
    status: { type: String, enum: ['Active', 'Claimed', 'Disqualified'], default: 'Active' }, // Player's status in this game
  }],
  winnerSlipId: String, // The slipId of the winning player if any
  winningAmount: Number, // Amount won if applicable
  startTime: { type: Date, default: Date.now },
  endTime: Date,
});
const Game = mongoose.model('Game', gameSchema);


const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true }, // Denormalized for easier reporting
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  slipId: String, // Associated bingo card slip ID for bets/wins/cancellations
  type: { type: String, enum: ['deposit', 'bet', 'win', 'withdrawal', 'cancellation', 'disqualification'], required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});
const Transaction = mongoose.model('Transaction', transactionSchema);

const cashierConfigSchema = new mongoose.Schema({
  game_type: { type: String, required: true, unique: true }, // e.g., 'BINGO'
  // General game settings that can be configured by cashier/admin
  betAmount: { type: Number, default: 10 },
  houseEdge: { type: Number, default: 15 },
  winningPattern: { type: String, default: 'anyTwoLines' },
});
const CashierConfig = mongoose.model('CashierConfig', cashierConfigSchema);

// --- Global State for Active Game Session (in-memory for quick access during active play) ---
const activeGames = new Map(); // gameId -> { gameDocument, timeoutIdForAutoCall }

// --- Helper Functions ---

const getBingoLetter = (num) => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};

// Helper to generate a dummy Bingo card (for demonstration)
const generateBingoCardData = () => {
    const card = {};
    const columns = ['B', 'I', 'N', 'G', 'O'];
    const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };

    columns.forEach(col => {
        const nums = [];
        while (nums.length < 5) {
            const num = Math.floor(Math.random() * (ranges[col][1] - ranges[col][0] + 1)) + ranges[col][0];
            if (!nums.includes(num)) {
                nums.push(num);
            }
        }
        card[col] = nums.sort((a, b) => a - b);
    });
    return card;
};

// --- Initial Data Setup ---
async function setupInitialData() {
  try {
    // Create a default user if none exists (for testing login)
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      const newUser = new User({ username: 'admin', password: 'password123' }); // Password will be hashed by pre-save hook
      await newUser.save();
      console.log('Default admin user created.');
    }

    // Create default cashier config if none exists
    const defaultCashier = await CashierConfig.findOne({ game_type: 'BINGO' });
    if (!defaultCashier) {
      const newConfig = new CashierConfig({
        game_type: 'BINGO',
        betAmount: 10,
        houseEdge: 15,
        winningPattern: 'anyTwoLines',
      });
      await newConfig.save();
      console.log('Default BINGO cashier config created.');
    }
  } catch (error) {
    console.error('Error during initial data setup:', error);
  }
}

// Call initial data setup on server start
setupInitialData();


// --- API Routes ---

// Register User (Optional - for initial user creation)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error (e.g., username already exists)
      return res.status(400).json({ message: 'Username already exists.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login User
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'supersecretjwtkey', // Use .env variable
      { expiresIn: '7d' }
    );

    res.status(200).json({ message: 'Login successful!', token, user: { id: user._id, username: user.username } });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, user) => {
    if (err) {
      console.error('JWT Verification FAILED:', err.message);
      return res.sendStatus(403); // Forbidden (invalid token)
    }
    req.user = user;
    next();
  });
};

// --- Game Management Endpoints ---

// Start Game API Endpoint (BAe equivalent for general game generation)
app.post('/api/start-game', authenticateToken, async (req, res) => {
  try {
    const { betAmount, houseEdge, winningPattern } = req.body;
    const user = req.user;

    if (!betAmount || !houseEdge || !winningPattern) {
      return res.status(400).json({ message: 'Missing game parameters.' });
    }

    const gameId = `GAME_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Clear any previous active game from memory to ensure only one active game at a time
    // In a multi-user system, this map would be keyed by user/session, or a more robust state management
    activeGames.forEach((_, key) => activeGames.delete(key)); // Clear all previous games

    const newGame = new Game({
      gameId,
      status: 'waiting_for_players',
      betAmount: Number(betAmount),
      houseEdge: Number(houseEdge),
      winningPattern,
      drawnNumbers: [],
      uncalledNumbers: [], // Will be populated on first call
      players: [],
    });

    await newGame.save();
    activeGames.set(gameId, newGame); // Store game document in memory

    console.log(`Game ${gameId} started by ${user.username} (DB & in-memory).`);

    res.status(200).json({
      message: 'Game started successfully!',
      gameId: newGame.gameId,
      gameState: {
          status: newGame.status,
          players: newGame.players,
          drawnNumbers: newGame.drawnNumbers,
          lastCalledNumber: newGame.lastCalledNumber,
          uncalledNumbers: newGame.uncalledNumbers.length, // Client only needs count
      }
    });

  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ message: 'Server error during game start.' });
  }
});

// Add Players to a game (RAe equivalent)
app.post('/api/game/:gameId/add-players', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    const { newTickets } = req.body; // newTickets expected as an array of slipId (numbers)
    let game = activeGames.get(gameId);

    if (!game) {
        // Attempt to load from DB if not in memory (e.g., server restart)
        game = await Game.findOne({ gameId: gameId });
        if (!game) {
            return res.status(404).json({ message: 'Game not found.' });
        }
        activeGames.set(gameId, game); // Add to memory
    }

    if (game.status === 'in_progress') {
        return res.status(400).json({ message: 'Cannot add players to a game in progress.' });
    }

    const playersToAdd = [];
    for (const slipId of newTickets) {
        let bingoCard = await BingoCard.findOne({ slipId: String(slipId) });
        if (!bingoCard) {
            bingoCard = new BingoCard({
                slipId: String(slipId),
                cardNumbers: generateBingoCardData(),
            });
            await bingoCard.save();
        }

        // Check if player is already in the game
        if (!game.players.some(p => p.slipId === String(slipId))) {
            playersToAdd.push({
                userId: req.user.userId,
                username: req.user.username,
                slipId: String(slipId),
                bingoCard: bingoCard._id,
                status: 'Active',
            });

            // Log bet transaction
            const transaction = new Transaction({
                userId: req.user.userId,
                username: req.user.username,
                gameId: game._id,
                slipId: String(slipId),
                type: 'bet',
                amount: game.betAmount, // Use game's bet amount
            });
            await transaction.save();
        }
    }

    game.players.push(...playersToAdd);
    await game.save(); // Save changes to DB

    console.log(`Players added to game ${gameId}. Total players: ${game.players.length}`);
    res.status(200).json({
        message: 'Players added successfully!',
        players: game.players,
        gameId: game.gameId
    });
});

// Remove a player from a game (from UI's 'Add Players' panel)
app.delete('/api/game/:gameId/remove-player/:slipId', authenticateToken, async (req, res) => {
    const { gameId, slipId } = req.params;
    let game = activeGames.get(gameId);

    if (!game) {
        game = await Game.findOne({ gameId: gameId });
        if (!game) return res.status(404).json({ message: 'Game not found.' });
        activeGames.set(gameId, game);
    }

    if (game.status === 'in_progress') {
        return res.status(400).json({ message: 'Cannot remove players from a game in progress.' });
    }

    const playerIndex = game.players.findIndex(player => player.slipId === slipId);
    if (playerIndex === -1) {
        return res.status(404).json({ message: `Player ${slipId} not found in game ${gameId}.` });
    }

    const removedPlayer = game.players.splice(playerIndex, 1)[0];
    await game.save(); // Save changes to DB

    // Log cancellation transaction
    const transaction = new Transaction({
        userId: removedPlayer.userId,
        username: removedPlayer.username,
        gameId: game._id,
        slipId: removedPlayer.slipId,
        type: 'cancellation',
        amount: game.betAmount, // Refund the bet amount
    });
    await transaction.save();

    console.log(`Player ${slipId} removed from game ${gameId}.`);
    res.status(200).json({
        message: `Player ${slipId} removed successfully.`,
        players: game.players,
        gameId: game.gameId
    });
});

// Call the next Bingo number
app.post('/api/game/:gameId/call-number', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    let game = activeGames.get(gameId);

    if (!game) {
        game = await Game.findOne({ gameId: gameId });
        if (!game) return res.status(404).json({ message: 'Game not found.' });
        activeGames.set(gameId, game);
    }

    if (game.status === 'waiting_for_players') {
        if (game.players.length === 0) {
            return res.status(400).json({ message: 'Cannot start calling numbers without any players.' });
        }
        game.status = 'in_progress';
        // Initialize uncalledNumbers if it's the first call for this game
        if (game.uncalledNumbers.length === 0 && game.drawnNumbers.length === 0) {
            game.uncalledNumbers = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        }
    }

    if (game.status !== 'in_progress') {
        return res.status(400).json({ message: `Game is not in progress. Current status: ${game.status}.` });
    }

    if (game.uncalledNumbers.length === 0) {
        game.status = 'ended';
        await game.save();
        return res.status(200).json({
            message: 'All numbers called! Game ended.',
            lastCalledNumber: null,
            drawnNumbers: game.drawnNumbers,
            gameStatus: game.status,
            uncalledNumbersCount: 0
        });
    }

    const nextNumber = game.uncalledNumbers.shift(); // Remove from beginning
    game.drawnNumbers.push(nextNumber);
    
    game.lastCalledNumber = {
        number: nextNumber,
        letter: getBingoLetter(nextNumber)
    };

    await game.save(); // Save updated game state to DB

    console.log(`Called: ${game.lastCalledNumber.letter}${game.lastCalledNumber.number} for game ${game.gameId}`);
    res.status(200).json({
        message: 'Number called successfully.',
        lastCalledNumber: game.lastCalledNumber,
        drawnNumbers: game.drawnNumbers,
        gameStatus: game.status,
        uncalledNumbersCount: game.uncalledNumbers.length
    });
});

// End a game (MJ equivalent)
app.post('/api/game/:gameId/end-game', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    let game = activeGames.get(gameId);

    if (!game) {
        game = await Game.findOne({ gameId: gameId });
        if (!game) return res.status(404).json({ message: 'Game not found.' });
    }

    if (game.status !== 'ended') {
        game.status = 'ended';
        game.endTime = new Date();
        await game.save(); // Persist end time and status
    }
    
    // Clear game from active memory
    activeGames.delete(gameId);

    console.log(`Game ${gameId} ended successfully (DB & in-memory cleanup).`);
    res.status(200).json({
        message: `Game ${gameId} has been ended.`,
        gameId,
        gameStatus: 'ended'
    });
});


// Dummy Check Claim API Endpoint (jAe equivalent)
app.post('/api/game/:gameId/check-claim', authenticateToken, async (req, res) => {
    const { gameId } = req.params;
    const { slipId } = req.body;
    let game = activeGames.get(gameId);

    if (!game) {
        game = await Game.findOne({ gameId: gameId });
        if (!game) return res.status(404).json({ message: 'Game not found.' });
        activeGames.set(gameId, game);
    }

    if (game.status !== 'in_progress') {
        return res.status(400).json({ message: 'Game is not in progress. Claims can only be checked during an active game.' });
    }

    const player = game.players.find(p => p.slipId === String(slipId));

    if (!player) {
        return res.status(200).json({
            message: `Claim for Slip ID ${slipId} is not valid. Player not found in this game.`,
            isValid: false,
            slipId
        });
    }

    // In a real game, complex bingo pattern validation would happen here.
    // For this example, we'll implement a very basic dummy win condition:
    // If more than 5 numbers are drawn, consider it a "win" for demonstration.
    // Replace with actual bingo winning pattern check.
    const isWinner = game.drawnNumbers.length > 5; // DUMMY LOGIC

    if (isWinner && player.status === 'Active') {
        player.status = 'Claimed'; // Mark player as claimed
        game.winnerSlipId = player.slipId; // Assign winner (simple: first to claim)
        game.winningAmount = game.betAmount * 10; // Dummy winning amount
        await game.save(); // Save updated player status and winner info

        // Log win transaction
        const transaction = new Transaction({
            userId: player.userId,
            username: player.username,
            gameId: game._id,
            slipId: player.slipId,
            type: 'win',
            amount: game.winningAmount,
        });
        await transaction.save();

        console.log(`Dummy check claim: Slip ID ${slipId} is a winner for game ${gameId}.`);
        res.status(200).json({
            message: `Congratulations! Ticket #${slipId} is a winner! Amount: ${game.winningAmount} ETB.`,
            isValid: true,
            slipId,
            winningAmount: game.winningAmount,
        });
    } else if (player.status === 'Claimed') {
        res.status(200).json({
            message: `Ticket #${slipId} has already been claimed.`,
            isValid: false,
            slipId
        });
    } else {
        res.status(200).json({
            message: `Claim for Ticket #${slipId} is not valid yet. Keep playing!`,
            isValid: false,
            slipId
        });
    }
});


// --- Other API Endpoints from api.js snippet ---

// 1. Create a default bingo card (mock) (OAe equivalent)
app.get('/api/bingo-card/default', authenticateToken, async (req, res) => {
    // Generate a new card but don't save it unless explicitly activated
    const defaultCardData = generateBingoCardData();
    res.status(200).json({ card: defaultCardData, message: "Default bingo card generated." });
});

// 3. Get cashier config (kAe equivalent)
app.get('/api/cashier-config', authenticateToken, async (req, res) => {
    const { game_type } = req.query; // Expects game_type=BINGO
    if (game_type !== 'BINGO') {
        return res.status(400).json({ message: 'Invalid game_type specified.' });
    }
    const config = await CashierConfig.findOne({ game_type });
    if (!config) {
        return res.status(404).json({ message: 'Cashier configuration not found for BINGO.' });
    }
    res.status(200).json(config);
});

// 4. Update cashier config (PAe equivalent)
app.patch('/api/cashier-config', authenticateToken, async (req, res) => {
    const { game_type, betAmount, houseEdge, winningPattern } = req.body;
    if (game_type !== 'BINGO') {
        return res.status(400).json({ message: 'Invalid game_type specified.' });
    }

    try {
        const updatedConfig = await CashierConfig.findOneAndUpdate(
            { game_type },
            { betAmount, houseEdge, winningPattern },
            { new: true, upsert: true, runValidators: true } // Create if not exists, return updated doc
        );
        res.status(200).json({ message: 'Cashier configuration updated successfully.', config: updatedConfig });
    } catch (error) {
        console.error('Error updating cashier config:', error);
        res.status(500).json({ message: 'Failed to update cashier configuration.' });
    }
});

// 5. Update bingo game pattern (IAe equivalent)
// This endpoint updates the winning pattern for the *current active game*.
// If no game is active, it might try to set it for the default config.
app.patch('/api/bingo-game/pattern', authenticateToken, async (req, res) => {
    const { gameId, pattern } = req.body;
    
    if (!pattern) {
        return res.status(400).json({ message: 'Winning pattern not provided.' });
    }

    try {
        let game = activeGames.get(gameId);
        if (game) {
            // Update in-memory and DB
            game.winningPattern = pattern;
            await game.save();
            return res.status(200).json({ message: 'Game winning pattern updated.', gameId: game.gameId, winningPattern: game.winningPattern });
        } else {
            // If no active game, perhaps update the default cashier config?
            const updatedConfig = await CashierConfig.findOneAndUpdate(
                { game_type: 'BINGO' },
                { winningPattern: pattern },
                { new: true }
            );
            if (updatedConfig) {
                 return res.status(200).json({ message: 'Default winning pattern updated as no game is active.', winningPattern: updatedConfig.winningPattern });
            }
            return res.status(404).json({ message: 'No active game found and default config not updatable.' });
        }
    } catch (error) {
        console.error('Error updating game pattern:', error);
        res.status(500).json({ message: 'Failed to update game winning pattern.' });
    }
});


// 7. Disqualify a bet (MAe equivalent)
app.patch('/api/bingo-game/disqualify-bet', authenticateToken, async (req, res) => {
    const { gameId, card_id } = req.body; // card_id is slipId in our context
    let game = activeGames.get(gameId);

    if (!game) {
        game = await Game.findOne({ gameId: gameId });
        if (!game) return res.status(404).json({ message: 'Game not found.' });
        activeGames.set(gameId, game);
    }

    const player = game.players.find(p => p.slipId === String(card_id));
    if (!player) {
        return res.status(404).json({ message: `Player with slip ID ${card_id} not found in game ${gameId}.` });
    }

    if (player.status === 'Disqualified') {
        return res.status(400).json({ message: `Player with slip ID ${card_id} is already disqualified.` });
    }

    player.status = 'Disqualified';
    await game.save();

    // Log disqualification transaction
    const transaction = new Transaction({
        userId: player.userId,
        username: player.username,
        gameId: game._id,
        slipId: player.slipId,
        type: 'disqualification',
        amount: -game.betAmount, // Represent as a loss/chargeback if needed
    });
    await transaction.save();

    res.status(200).json({ message: `Player with slip ID ${card_id} has been disqualified.`, playerStatus: 'Disqualified' });
});


// 8. Unassign a bingo card (similar to $Ae)
// This is typically done if a card was assigned but not yet paid/activated or needs to be removed.
// In our current setup, `remove-player` already covers removing a player from an active game session.
// This endpoint will essentially just call the existing `remove-player` logic, but without needing `gameId` in path.
app.patch('/api/bingo-card/unassign/:slipId', authenticateToken, async (req, res) => {
    const { slipId } = req.params;
    // Find the current active game
    let gameId = null;
    if (activeGames.size > 0) {
        gameId = activeGames.keys().next().value; // Get the first active game ID
    }

    if (!gameId) {
        return res.status(400).json({ message: 'No active game session to unassign card from.' });
    }

    // Call the remove-player logic
    const mockReq = { params: { gameId, slipId }, user: req.user };
    await app.handle(mockReq, res); // Use app.handle to route internally
    // The response will be sent by the remove-player handler
});

// 10. Get user profile (NAe equivalent)
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password'); // Exclude password
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ profile: user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to retrieve user profile.' });
    }
});

// 11. Get cashier summary (LAe equivalent)
app.get('/api/cashiers/summary', authenticateToken, async (req, res) => {
    const { from, to } = req.query; // from and to are date strings
    const { username } = req.user; // Assuming summary is for the logged-in user (retail user)

    if (!from || !to) {
        return res.status(400).json({ message: 'Missing "from" and "to" date parameters.' });
    }

    const startDate = new Date(from);
    const endDate = new Date(to);

    if (isNaN(startDate) || isNaN(endDate)) {
        return res.status(400).json({ message: 'Invalid date format for "from" or "to".' });
    }

    try {
        // Find transactions for the given user within the date range
        const transactions = await Transaction.find({
            username: username,
            timestamp: { $gte: startDate, $lte: endDate }
        });

        // Aggregate data
        let totalDeposits = 0;
        let totalBets = 0;
        let totalCancellations = 0;
        let totalRedeemed = 0; // Represents wins in this context
        let totalWithdrawals = 0;
        let startBalance = 0; // This needs a historical view to be accurate. For mock, it's complex.
        let endBalance = 0;   // For now, simplify this, perhaps just net of transactions.

        transactions.forEach(t => {
            switch (t.type) {
                case 'deposit':
                    totalDeposits += t.amount;
                    break;
                case 'bet':
                    totalBets += t.amount;
                    break;
                case 'win':
                    totalRedeemed += t.amount;
                    break;
                case 'withdrawal':
                    totalWithdrawals += t.amount;
                    break;
                case 'cancellation':
                    totalCancellations += t.amount;
                    break;
                case 'disqualification':
                    // Disqualification might impact net amount, e.g., if it's a bet that was removed.
                    // For summary, if amount is negative for disqualification, it contributes to deductions.
                    // For now, let's keep it separate or decide how it impacts net balance.
                    break;
            }
        });

        // Simplified balance calculation: Net of all relevant transactions
        const netChange = totalDeposits - totalWithdrawals - totalBets + totalRedeemed - totalCancellations;
        // The actual "Start Balance" and "End Balance" in a real system come from a ledger.
        // For this mock, we can set Start Balance to 0 and End Balance to netChange for simplicity.
        // Or, assume start balance is some initial value.
        endBalance = netChange;


        res.status(200).json({
            // Structure resembles the PDF report for "Raf"
            retailUser: username,
            fromDate: startDate.toISOString(),
            toDate: endDate.toISOString(),
            startBalance: 0, // Placeholder, actual requires more complex ledger
            deposits: totalDeposits,
            bets: totalBets,
            cancellations: totalCancellations,
            redeemed: totalRedeemed, // Wins treated as redeemed amount
            withdraws: totalWithdrawals,
            endBalance: endBalance,
            message: "Cashier summary generated."
        });

    } catch (error) {
        console.error('Error generating cashier summary:', error);
        res.status(500).json({ message: 'Failed to generate cashier summary.' });
    }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


















// require('dotenv').config(); // Load environment variables from .env
// const express = require('express');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const cors = require('cors');

// const app = express();
// const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// // In-memory store for active game sessions. Game state is volatile and resets on server restart.
// // gameId -> { gameId, status, betAmount, houseEdge, winningPattern, players[], drawnNumbers[], lastCalledNumber, uncalledNumbers[] }
// const activeGames = new Map();

// // Helper to generate a dummy Bingo card (for demonstration)
// // This will return a string representation, as Bingo cards are NOT persisted in the DB per request.
// const generateBingoCard = (slipId) => {
//     const card = {};
//     const columns = ['B', 'I', 'N', 'G', 'O'];
//     const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };

//     columns.forEach(col => {
//         const nums = [];
//         while (nums.length < 5) {
//             const num = Math.floor(Math.random() * (ranges[col][1] - ranges[col][0] + 1)) + ranges[col][0];
//             if (!nums.includes(num)) {
//                 nums.push(num);
//             }
//         }
//         card[col] = nums.sort((a, b) => a - b);
//     });
//     return `${card.B.join('-')}-${card.I.join('-')}-${card.N.join('-')}-${card.G.join('-')}-${card.O.join('-')}`;
// };

// // Middleware
// app.use(cors()); // Enable CORS for all routes (important for frontend communication)
// app.use(express.json()); // Body parser for JSON requests

// // MongoDB Connection
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected successfully!'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // --- Mongoose Schemas and Models (only for persistent data: User, Config, Financial Transactions) ---

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// // Hash password before saving the user
// userSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

// const User = mongoose.model('User', userSchema);

// const cashierConfigSchema = new mongoose.Schema({
//   game_type: { type: String, required: true, unique: true }, // e.g., 'BINGO'
//   // General game settings that can be configured by cashier/admin
//   betAmount: { type: Number, default: 10 },
//   houseEdge: { type: Number, default: 15 },
//   winningPattern: { type: String, default: 'anyTwoLines' },
// });
// const CashierConfig = mongoose.model('CashierConfig', cashierConfigSchema);

// // Simplified Transaction Schema for financial reporting
// const transactionSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   username: { type: String, required: true }, // Denormalized for easier reporting
//   gameId: { type: String }, // The ID of the game (string), not a ref to a Game document
//   slipId: String, // Associated ticket ID for bets/wins/cancellations
//   type: { type: String, enum: ['deposit', 'bet', 'win', 'withdrawal', 'cancellation', 'disqualification'], required: true },
//   amount: { type: Number, required: true },
//   timestamp: { type: Date, default: Date.now },
// });
// const Transaction = mongoose.model('Transaction', transactionSchema);

// // --- Helper Functions ---

// const getBingoLetter = (num) => {
//   if (num >= 1 && num <= 15) return 'B';
//   if (num >= 16 && num <= 30) return 'I';
//   if (num >= 31 && num <= 45) return 'N';
//   if (num >= 46 && num <= 60) return 'G';
//   if (num >= 61 && num <= 75) return 'O';
//   return '';
// };

// // --- Initial Data Setup ---
// async function setupInitialData() {
//   try {
//     // Create a default user if none exists (for testing login)
//     const adminUser = await User.findOne({ username: 'admin' });
//     if (!adminUser) {
//       const newUser = new User({ username: 'admin', password: 'password123' }); // Password will be hashed by pre-save hook
//       await newUser.save();
//       console.log('Default admin user created.');
//     }

//     // Create default cashier config if none exists
//     const defaultCashier = await CashierConfig.findOne({ game_type: 'BINGO' });
//     if (!defaultCashier) {
//       const newConfig = new CashierConfig({
//         game_type: 'BINGO',
//         betAmount: 10,
//         houseEdge: 15,
//         winningPattern: 'anyTwoLines',
//       });
//       await newConfig.save();
//       console.log('Default BINGO cashier config created.');
//     }
//   } catch (error) {
//     console.error('Error during initial data setup:', error);
//   }
// }

// // Call initial data setup on server start
// setupInitialData();

// // --- Authentication Middleware ---
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.sendStatus(401); // Unauthorized
//   }

//   jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, user) => {
//     if (err) {
//       console.error('JWT Verification FAILED:', err.message);
//       return res.sendStatus(403); // Forbidden (invalid token)
//     }
//     req.user = user;
//     next();
//   });
// };

// // --- API Routes ---

// // NEW: Register User with Initial Balance
// app.post('/api/register-with-balance', async (req, res) => {
//   try {
//     const { username, password, initialBalance } = req.body;

//     // Validate initial balance
//     if (typeof initialBalance !== 'number' || initialBalance < 0) {
//       return res.status(400).json({ message: 'Initial balance must be a non-negative number.' });
//     }

//     // Check if user already exists
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Username already exists. Please choose a different one.' });
//     }

//     // Create the new user
//     const user = new User({ username, password });
//     await user.save(); // Password will be hashed by pre-save hook

//     // Log the initial deposit transaction for the new user
//     const transaction = new Transaction({
//       userId: user._id,
//       username: user.username,
//       type: 'deposit',
//       amount: initialBalance,
//       // No gameId or slipId for an initial deposit
//     });
//     await transaction.save();

//     res.status(201).json({ message: 'User registered successfully and initial balance added!' });
//   } catch (error) {
//     console.error('Registration error:', error);
//     if (error.code === 11000) { // Duplicate key error
//         return res.status(400).json({ message: 'Username already exists.' });
//     }
//     res.status(500).json({ message: 'Server error during registration.' });
//   }
// });


// // Login User
// app.post('/api/login', async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const user = await User.findOne({ username });

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid username or password.' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid username or password.' });
//     }

//     // Generate JWT
//     const token = jwt.sign(
//       { userId: user._id, username: user.username },
//       process.env.JWT_SECRET || 'supersecretjwtkey', // Use .env variable
//       { expiresIn: '7d' }
//     );

//     res.status(200).json({ message: 'Login successful!', token, user: { id: user._id, username: user.username } });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error during login.' });
//   }
// });

// // --- Game Management Endpoints (operate on in-memory activeGames and log transactions) ---

// // Start Game API Endpoint
// app.post('/api/start-game', authenticateToken, async (req, res) => {
//   try {
//     const { betAmount, houseEdge, winningPattern } = req.body;
//     const user = req.user;

//     if (!betAmount || !houseEdge || !winningPattern) {
//       return res.status(400).json({ message: 'Missing game parameters.' });
//     }

//     const gameId = `GAME_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

//     // Clear any previous active game from memory to ensure only one active game at a time per operator
//     // In a multi-user system, this map would be keyed by user/session, or a more robust state management
//     activeGames.forEach((_, key) => activeGames.delete(key)); // Clear all previous games

//     const newGameState = {
//       gameId,
//       status: 'waiting_for_players', // 'waiting_for_players', 'in_progress', 'ended'
//       betAmount: Number(betAmount),
//       houseEdge: Number(houseEdge),
//       winningPattern,
//       players: [],  // Players in the current session (in-memory)
//       drawnNumbers: [],
//       lastCalledNumber: null,
//       uncalledNumbers: [], // Will be filled on first call-number
//       startTime: new Date(),
//     };

//     activeGames.set(gameId, newGameState); // Store game state in memory

//     console.log(`Game ${gameId} started by ${user.username} (in-memory).`);

//     res.status(200).json({
//       message: 'Game started successfully!',
//       gameId: newGameState.gameId,
//       gameState: { // Return a subset of game state relevant to client init
//           status: newGameState.status,
//           players: newGameState.players,
//           drawnNumbers: newGameState.drawnNumbers,
//           lastCalledNumber: newGameState.lastCalledNumber,
//           uncalledNumbers: newGameState.uncalledNumbers.length, // Client gets empty array here initially
//       }
//     });

//   } catch (error) {
//     console.error('Error starting game:', error);
//     res.status(500).json({ message: 'Server error during game start.' });
//   }
// });

// // Add Players to a game (and log bet transactions)
// app.post('/api/game/:gameId/add-players', authenticateToken, async (req, res) => {
//     const { gameId } = req.params;
//     const { newTickets } = req.body; // newTickets expected as an array of slipId (numbers)
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }
//     if (gameState.status === 'in_progress') {
//         return res.status(400).json({ message: 'Cannot add players to a game in progress.' });
//     }

//     const playersAdded = [];
//     for (const slipId of newTickets) {
//         // Check if player is already in the game (in-memory)
//         if (!gameState.players.some(p => p.slipId === String(slipId))) {
//             playersAdded.push({
//                 id: `P${slipId}`, // Unique ID for in-memory tracking
//                 slipId: String(slipId), // The user-facing ticket/slip ID
//                 bingoCard: generateBingoCard(slipId), // Generate a dummy bingo card (not persisted)
//                 status: 'Active'
//             });

//             // Log bet transaction to DB
//             try {
//                 const transaction = new Transaction({
//                     userId: req.user.userId,
//                     username: req.user.username,
//                     gameId: gameState.gameId, // ID of the in-memory game
//                     slipId: String(slipId),
//                     type: 'bet',
//                     amount: gameState.betAmount, // Use game's bet amount
//                 });
//                 await transaction.save();
//             } catch (dbError) {
//                 console.error('Error saving bet transaction to DB:', dbError);
//                 // Continue, but maybe alert client of partial success
//             }
//         }
//     }

//     gameState.players.push(...playersAdded);
//     activeGames.set(gameId, gameState); // Update the in-memory map

//     console.log(`Players added to game ${gameId}. Total players: ${gameState.players.length}`);
//     res.status(200).json({
//         message: 'Players added successfully!',
//         players: gameState.players, // Return updated list of players (in-memory)
//         gameId: gameState.gameId
//     });
// });

// // Remove a player from a game (and log cancellation transaction)
// app.delete('/api/game/:gameId/remove-player/:slipId', authenticateToken, async (req, res) => {
//     const { gameId, slipId } = req.params;
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }
//     if (gameState.status === 'in_progress') {
//         return res.status(400).json({ message: 'Cannot remove players from a game in progress.' });
//     }

//     const initialPlayerCount = gameState.players.length;
//     const removedPlayer = gameState.players.find(player => player.slipId === slipId);

//     if (!removedPlayer) {
//         return res.status(404).json({ message: `Player ${slipId} not found in game ${gameId}.` });
//     }

//     gameState.players = gameState.players.filter(player => player.slipId !== slipId);
//     activeGames.set(gameId, gameState); // Update in-memory map

//     // Log cancellation transaction to DB
//     try {
//         const transaction = new Transaction({
//             userId: req.user.userId,
//             username: req.user.username,
//             gameId: gameState.gameId,
//             slipId: removedPlayer.slipId,
//             type: 'cancellation',
//             amount: gameState.betAmount, // Refund the bet amount
//         });
//         await transaction.save();
//     } catch (dbError) {
//         console.error('Error saving cancellation transaction to DB:', dbError);
//     }

//     console.log(`Player ${slipId} removed from game ${gameId}.`);
//     res.status(200).json({
//         message: `Player ${slipId} removed successfully.`,
//         players: gameState.players, // Return updated list of players (in-memory)
//         gameId: gameState.gameId
//     });
// });

// // Call the next Bingo number
// app.post('/api/game/:gameId/call-number', authenticateToken, async (req, res) => {
//     const { gameId } = req.params;
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }
    
//     // Transition to 'in_progress' if game just started and players are ready
//     if (gameState.status === 'waiting_for_players') {
//         if (gameState.players.length === 0) {
//             return res.status(400).json({ message: 'Cannot start calling numbers without any players.' });
//         }
//         gameState.status = 'in_progress';
//         // Initialize uncalledNumbers only when first number is truly called
//         if (gameState.uncalledNumbers.length === 0 && gameState.drawnNumbers.length === 0) {
//             gameState.uncalledNumbers = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
//         }
//     }

//     if (gameState.status !== 'in_progress') {
//         return res.status(400).json({ message: `Game is not in progress. Current status: ${gameState.status}.` });
//     }

//     if (gameState.uncalledNumbers.length === 0) {
//         gameState.status = 'ended';
//         activeGames.set(gameId, gameState); // Update in-memory map
//         return res.status(200).json({
//             message: 'All numbers called! Game ended.',
//             lastCalledNumber: null,
//             drawnNumbers: gameState.drawnNumbers,
//             gameStatus: gameState.status,
//             uncalledNumbersCount: 0
//         });
//     }

//     const nextNumber = gameState.uncalledNumbers.shift(); // Remove from beginning
//     gameState.drawnNumbers.push(nextNumber);
    
//     gameState.lastCalledNumber = {
//         number: nextNumber,
//         letter: getBingoLetter(nextNumber)
//     };

//     activeGames.set(gameId, gameState); // Update in-memory map

//     console.log(`Called: ${gameState.lastCalledNumber.letter}${gameState.lastCalledNumber.number} for game ${gameId}`);
//     res.status(200).json({
//         message: 'Number called successfully.',
//         lastCalledNumber: gameState.lastCalledNumber,
//         drawnNumbers: gameState.drawnNumbers,
//         gameStatus: gameState.status,
//         uncalledNumbersCount: gameState.uncalledNumbers.length
//     });
// });

// // End a game
// app.post('/api/game/:gameId/end-game', authenticateToken, (req, res) => {
//     const { gameId } = req.params;
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }

//     gameState.status = 'ended';
//     // No need to explicitly save to DB as game data is in-memory only.
//     // We clear it from the map.
//     activeGames.delete(gameId);

//     console.log(`Game ${gameId} ended successfully (in-memory cleanup).`);
//     res.status(200).json({
//         message: `Game ${gameId} has been ended.`,
//         gameId,
//         gameStatus: 'ended'
//     });
// });

// // Dummy Check Claim API Endpoint (and log win transaction)
// app.post('/api/game/:gameId/check-claim', authenticateToken, async (req, res) => {
//     const { gameId } = req.params;
//     const { slipId } = req.body;
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }
//     if (gameState.status !== 'in_progress') {
//         return res.status(400).json({ message: 'Game is not in progress. Claims can only be checked during an active game.' });
//     }

//     const player = gameState.players.find(p => p.slipId === String(slipId));

//     if (!player) {
//         return res.status(200).json({
//             message: `Claim for Slip ID ${slipId} is not valid. Player not found in this game.`,
//             isValid: false,
//             slipId
//         });
//     }

//     // DUMMY WIN LOGIC: For demonstration, a player wins if more than 10 numbers are drawn
//     const isWinner = gameState.drawnNumbers.length > 10;

//     if (isWinner && player.status === 'Active') {
//         player.status = 'Claimed'; // Mark player as claimed (in-memory)
//         // No need to persist game.winnerSlipId or game.winningAmount as game is in-memory.

//         // Log win transaction to DB
//         const winningAmount = gameState.betAmount * (100 / (100 - gameState.houseEdge)); // Example payout formula
//         try {
//             const transaction = new Transaction({
//                 userId: req.user.userId,
//                 username: req.user.username,
//                 gameId: gameState.gameId,
//                 slipId: player.slipId,
//                 type: 'win',
//                 amount: winningAmount,
//             });
//             await transaction.save();
//         } catch (dbError) {
//             console.error('Error saving win transaction to DB:', dbError);
//             // This error doesn't stop the client from getting a "win" message, but data might be inconsistent.
//         }

//         console.log(`Dummy check claim: Slip ID ${slipId} is a winner for game ${gameId}.`);
//         res.status(200).json({
//             message: `Congratulations! Ticket #${slipId} is a winner! Amount: ${winningAmount.toFixed(2)} ETB.`,
//             isValid: true,
//             slipId,
//             winningAmount: winningAmount,
//         });
//     } else if (player.status === 'Claimed') {
//         res.status(200).json({
//             message: `Ticket #${slipId} has already been claimed.`,
//             isValid: false,
//             slipId
//         });
//     } else {
//         res.status(200).json({
//             message: `Claim for Ticket #${slipId} is not valid yet. Keep playing!`,
//             isValid: false,
//             slipId
//         });
//     }
// });

// // --- Cashier Configuration Endpoints ---

// // Get cashier config
// app.get('/api/cashier-config', authenticateToken, async (req, res) => {
//     const { game_type } = req.query; // Expects game_type=BINGO
//     if (game_type !== 'BINGO') {
//         return res.status(400).json({ message: 'Invalid game_type specified.' });
//     }
//     try {
//         const config = await CashierConfig.findOne({ game_type });
//         if (!config) {
//             return res.status(404).json({ message: 'Cashier configuration not found for BINGO.' });
//         }
//         res.status(200).json(config);
//     } catch (error) {
//         console.error('Error fetching cashier config:', error);
//         res.status(500).json({ message: 'Failed to retrieve cashier configuration.' });
//     }
// });

// // Update cashier config
// app.patch('/api/cashier-config', authenticateToken, async (req, res) => {
//     const { game_type, betAmount, houseEdge, winningPattern } = req.body;
//     if (game_type !== 'BINGO') {
//         return res.status(400).json({ message: 'Invalid game_type specified.' });
//     }

//     try {
//         const updatedConfig = await CashierConfig.findOneAndUpdate(
//             { game_type },
//             { betAmount, houseEdge, winningPattern },
//             { new: true, upsert: true, runValidators: true } // Create if not exists, return updated doc
//         );
//         res.status(200).json({ message: 'Cashier configuration updated successfully.', config: updatedConfig });
//     } catch (error) {
//         console.error('Error updating cashier config:', error);
//         res.status(500).json({ message: 'Failed to update cashier configuration.' });
//     }
// });

// // --- Reporting Endpoints ---

// // Get cashier summary report
// app.get('/api/cashiers/summary', authenticateToken, async (req, res) => {
//     const { from, to } = req.query; // from and to are date strings
//     const { username, userId } = req.user; // Summary for the logged-in retail user

//     if (!from || !to) {
//         return res.status(400).json({ message: 'Missing "from" and "to" date parameters.' });
//     }

//     const startDate = new Date(from);
//     // Adjust end date to include the entire day 'to'
//     const endDate = new Date(new Date(to).setHours(23, 59, 59, 999));

//     if (isNaN(startDate) || isNaN(endDate)) {
//         return res.status(400).json({ message: 'Invalid date format for "from" or "to".' });
//     }

//     try {
//         const transactions = await Transaction.find({
//             userId: userId, // Filter by the specific retail user
//             timestamp: { $gte: startDate, $lte: endDate }
//         });

//         let totalDeposits = 0;
//         let totalBets = 0;
//         let totalWins = 0; // Renamed from redeemed for clarity
//         let totalCancellations = 0;
//         let totalWithdrawals = 0;

//         transactions.forEach(t => {
//             switch (t.type) {
//                 case 'deposit':
//                     totalDeposits += t.amount;
//                     break;
//                 case 'bet':
//                     totalBets += t.amount;
//                     break;
//                 case 'win':
//                     totalWins += t.amount;
//                     break;
//                 case 'withdrawal':
//                     totalWithdrawals += t.amount;
//                     break;
//                 case 'cancellation':
//                     totalCancellations += t.amount;
//                     break;
//                 // 'disqualification' can be added/handled as needed
//             }
//         });

//         const netGameProfit = totalBets - totalWins;
//         const webDeveloperSharePercentage = 0.15; // 15%
//         const webDeveloperShare = netGameProfit * webDeveloperSharePercentage;
//         const retailerShare = netGameProfit * (1 - webDeveloperSharePercentage);

//         const netCashFlow = totalDeposits + totalBets - totalWins - totalCancellations - totalWithdrawals;

//         res.status(200).json({
//             retailUser: username,
//             fromDate: startDate.toISOString(),
//             toDate: endDate.toISOString(),
//             // Balances are harder to calculate without a running ledger or fixed start point, 
//             // so keeping them simplified/placeholder as in original snippet for clarity
//             startBalance: 0, 
//             deposits: totalDeposits,
//             bets: totalBets,
//             cancellations: totalCancellations,
//             redeemed: totalWins, // Keep 'redeemed' for consistency with PDF example
//             withdraws: totalWithdrawals,
//             endBalance: netCashFlow, // Reflects the net movement for the period
//             netGameProfit: netGameProfit,
//             retailerShare: retailerShare,
//             webDeveloperShare: webDeveloperShare,
//             message: "Cashier summary generated."
//         });

//     } catch (error) {
//         console.error('Error generating cashier summary:', error);
//         res.status(500).json({ message: 'Failed to generate cashier summary.' });
//     }
// });


// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
























































// require('dotenv').config(); // Load environment variables from .env
// const express = require('express');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const cors = require('cors');

// const app = express();
// const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// // In-memory store for active game sessions. Game state is volatile and resets on server restart.
// // gameId -> { gameId, status, betAmount, houseEdge, winningPattern, players[], drawnNumbers[], lastCalledNumber, uncalledNumbers[] }
// const activeGames = new Map();

// // Helper to generate a dummy Bingo card (for demonstration)
// // This will return a string representation, as Bingo cards are NOT persisted in the DB per request.
// const generateBingoCard = (slipId) => {
//     const card = {};
//     const columns = ['B', 'I', 'N', 'G', 'O'];
//     const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };

//     columns.forEach(col => {
//         const nums = [];
//         while (nums.length < 5) {
//             const num = Math.floor(Math.random() * (ranges[col][1] - ranges[col][0] + 1)) + ranges[col][0];
//             if (!nums.includes(num)) {
//                 nums.push(num);
//             }
//         }
//         card[col] = nums.sort((a, b) => a - b);
//     });
//     return `${card.B.join('-')}-${card.I.join('-')}-${card.N.join('-')}-${card.G.join('-')}-${card.O.join('-')}`;
// };

// // Middleware
// app.use(cors()); // Enable CORS for all routes (important for frontend communication)
// app.use(express.json()); // Body parser for JSON requests

// // MongoDB Connection
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('MongoDB connected successfully!'))
//   .catch(err => console.error('MongoDB connection error:', err));

// // --- Mongoose Schemas and Models (only for persistent data: User, Config, Financial Transactions) ---

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// // Hash password before saving the user
// userSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

// const User = mongoose.model('User', userSchema);

// const cashierConfigSchema = new mongoose.Schema({
//   game_type: { type: String, required: true, unique: true }, // e.g., 'BINGO'
//   // General game settings that can be configured by cashier/admin
//   betAmount: { type: Number, default: 10 },
//   houseEdge: { type: Number, default: 15 },
//   winningPattern: { type: String, default: 'anyTwoLines' },
// });
// const CashierConfig = mongoose.model('CashierConfig', cashierConfigSchema);

// // Simplified Transaction Schema for financial reporting
// const transactionSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   username: { type: String, required: true }, // Denormalized for easier reporting
//   gameId: { type: String }, // The ID of the game (string), not a ref to a Game document
//   slipId: String, // Associated ticket ID for bets/wins/cancellations
//   type: { type: String, enum: ['deposit', 'bet', 'win', 'withdrawal', 'cancellation', 'disqualification'], required: true },
//   amount: { type: Number, required: true },
//   timestamp: { type: Date, default: Date.now },
// });
// const Transaction = mongoose.model('Transaction', transactionSchema);

// // --- Helper Functions ---

// const getBingoLetter = (num) => {
//   if (num >= 1 && num <= 15) return 'B';
//   if (num >= 16 && num <= 30) return 'I';
//   if (num >= 31 && num <= 45) return 'N';
//   if (num >= 46 && num <= 60) return 'G';
//   if (num >= 61 && num <= 75) return 'O';
//   return '';
// };

// // --- Initial Data Setup ---
// async function setupInitialData() {
//   try {
//     const adminUser = await User.findOne({ username: 'admin' });
//     if (!adminUser) {
//       const newUser = new User({ username: 'admin', password: 'password123' });
//       await newUser.save();
//       console.log('Default admin user created with password "password123".');
//       const transaction = new Transaction({
//         userId: newUser._id,
//         username: newUser.username,
//         type: 'deposit',
//         amount: 1000,
//       });
//       await transaction.save();
//       console.log('Initial deposit logged for default admin.');
//     }

//     const defaultCashier = await CashierConfig.findOne({ game_type: 'BINGO' });
//     if (!defaultCashier) {
//       const newConfig = new CashierConfig({
//         game_type: 'BINGO',
//         betAmount: 10,
//         houseEdge: 15,
//         winningPattern: 'anyTwoLines',
//       });
//       await newConfig.save();
//       console.log('Default BINGO cashier config created.');
//     }
//   } catch (error) {
//     console.error('Error during initial data setup:', error);
//   }
// }

// setupInitialData();

// // --- Authentication Middleware ---
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.sendStatus(401); // Unauthorized
//   }

//   jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, user) => {
//     if (err) {
//       console.error('JWT Verification FAILED:', err.message);
//       return res.sendStatus(403); // Forbidden (invalid token)
//     }
//     req.user = user;
//     next();
//   });
// };

// // --- API Routes ---

// // Admin-only initial setup endpoint (NO AUTHENTICATION REQUIRED)
// app.post('/api/initial-admin-setup', async (req, res) => {
//   try {
//     const { username, password, initialBalance } = req.body;
//     if (username !== 'admin') {
//       return res.status(403).json({ message: 'This endpoint is for initial admin user setup only.' });
//     }
//     if (typeof initialBalance !== 'number' || initialBalance < 0) {
//       return res.status(400).json({ message: 'Initial balance must be a non-negative number.' });
//     }
//     const existingAdmin = await User.findOne({ username: 'admin' });
//     if (existingAdmin) {
//       return res.status(400).json({ message: 'Admin user already exists. Cannot create another admin.' });
//     }
//     const adminUser = new User({ username, password });
//     await adminUser.save();
//     const transaction = new Transaction({
//       userId: adminUser._id,
//       username: adminUser.username,
//       type: 'deposit',
//       amount: initialBalance,
//     });
//     await transaction.save();
//     res.status(201).json({ message: 'Admin user registered successfully and initial balance added!' });
//   } catch (error) {
//     console.error('Admin setup error:', error);
//     if (error.code === 11000) {
//         return res.status(400).json({ message: 'Username already exists (should have been caught by prior check).' });
//     }
//     res.status(500).json({ message: 'Server error during admin setup.' });
//   }
// });

// // Login User
// app.post('/api/login', async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid username or password.' });
//     }
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid username or password.' });
//     }
//     const token = jwt.sign(
//       { userId: user._id, username: user.username },
//       process.env.JWT_SECRET || 'supersecretjwtkey',
//       { expiresIn: '7d' }
//     );
//     res.status(200).json({ message: 'Login successful!', token, user: { id: user._id, username: user.username } });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error during login.' });
//   }
// });

// // --- Game Management Endpoints (operate on in-memory activeGames and log transactions) ---

// // OAe: GET /api/bingo-card/default - Generate a dummy bingo card (not save it)
// app.get('/api/bingo-card/default', authenticateToken, async (req, res) => {
//     const defaultCardData = generateBingoCard("dummy"); // Use a dummy slipId
//     res.status(200).json({ card: defaultCardData, message: "Default bingo card generated." });
// });

// // BAe: POST /api/bingo-game/generate - Start a new game
// app.post('/api/bingo-game/generate', authenticateToken, async (req, res) => {
//   try {
//     const { betAmount, houseEdge, winningPattern } = req.body;
//     const user = req.user;

//     if (!betAmount || !houseEdge || !winningPattern) {
//       return res.status(400).json({ message: 'Missing game parameters.' });
//     }

//     const gameId = `GAME_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
//     activeGames.forEach((_, key) => activeGames.delete(key));

//     const newGameState = {
//       gameId,
//       status: 'waiting_for_players',
//       betAmount: Number(betAmount),
//       houseEdge: Number(houseEdge),
//       winningPattern,
//       players: [],
//       drawnNumbers: [],
//       lastCalledNumber: null,
//       uncalledNumbers: [],
//       startTime: new Date(),
//     };

//     activeGames.set(gameId, newGameState);

//     console.log(`Game ${gameId} generated/started by ${user.username} (in-memory).`);

//     res.status(200).json({
//       message: 'Game generated successfully!',
//       gameId: newGameState.gameId,
//       gameState: {
//           status: newGameState.status,
//           players: newGameState.players,
//           drawnNumbers: newGameState.drawnNumbers,
//           lastCalledNumber: newGameState.lastCalledNumber,
//           uncalledNumbers: newGameState.uncalledNumbers.length,
//       }
//     });

//   } catch (error) {
//     console.error('Error generating game:', error);
//     res.status(500).json({ message: 'Server error during game generation.' });
//   }
// });

// // RAe: POST /api/bingo-card/activate-tickets - Add Players to a game (and log bet transactions)
// app.post('/api/bingo-card/activate-tickets', authenticateToken, async (req, res) => {
//     // This endpoint should actually take a gameId to associate tickets with.
//     // For now, it implicitly assumes there's one active game.
//     // In a real system, `gameId` should be part of the request body or path.
//     const activeGameId = activeGames.keys().next().value; // Get the ID of the currently active game
//     const gameState = activeGames.get(activeGameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'No active game found to activate tickets for.' });
//     }

//     const { ticketIds } = req.body;
//     if (!ticketIds || !Array.isArray(ticketIds)) {
//         return res.status(400).json({ message: 'Invalid ticketIds provided.' });
//     }

//     if (gameState.status === 'in_progress') {
//         return res.status(400).json({ message: 'Cannot activate tickets for a game in progress.' });
//     }

//     const playersAdded = [];
//     for (const slipId of ticketIds) {
//         if (!gameState.players.some(p => p.slipId === String(slipId))) {
//             playersAdded.push({
//                 id: `P${slipId}`,
//                 slipId: String(slipId),
//                 bingoCard: generateBingoCard(slipId),
//                 status: 'Active'
//             });
//             try {
//                 const transaction = new Transaction({
//                     userId: req.user.userId,
//                     username: req.user.username,
//                     gameId: gameState.gameId,
//                     slipId: String(slipId),
//                     type: 'bet',
//                     amount: gameState.betAmount,
//                 });
//                 await transaction.save();
//             } catch (dbError) {
//                 console.error('Error saving bet transaction to DB:', dbError);
//             }
//         }
//     }

//     gameState.players.push(...playersAdded);
//     activeGames.set(activeGameId, gameState);

//     console.log(`Tickets activated and players added to game ${activeGameId}. Total players: ${gameState.players.length}`);
//     res.status(200).json({
//         message: 'Tickets activated successfully!',
//         players: gameState.players,
//         gameId: gameState.gameId
//     });
// });

// // callNextNumber: POST /api/bingo-game/:gameId/call-number (Not in provided list, but needed for game flow)
// app.post('/api/bingo-game/:gameId/call-number', authenticateToken, async (req, res) => {
//     const { gameId } = req.params;
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }
    
//     if (gameState.status === 'waiting_for_players') {
//         if (gameState.players.length === 0) {
//             return res.status(400).json({ message: 'Cannot start calling numbers without any players.' });
//         }
//         gameState.status = 'in_progress';
//         if (gameState.uncalledNumbers.length === 0 && gameState.drawnNumbers.length === 0) {
//             gameState.uncalledNumbers = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
//         }
//     }

//     if (gameState.status !== 'in_progress') {
//         return res.status(400).json({ message: `Game is not in progress. Current status: ${gameState.status}.` });
//     }

//     if (gameState.uncalledNumbers.length === 0) {
//         gameState.status = 'ended';
//         activeGames.set(gameId, gameState);
//         return res.status(200).json({
//             message: 'All numbers called! Game ended.',
//             lastCalledNumber: null,
//             drawnNumbers: gameState.drawnNumbers,
//             gameStatus: gameState.status,
//             uncalledNumbersCount: 0
//         });
//     }

//     const nextNumber = gameState.uncalledNumbers.shift();
//     gameState.drawnNumbers.push(nextNumber);
    
//     gameState.lastCalledNumber = {
//         number: nextNumber,
//         letter: getBingoLetter(nextNumber)
//     };

//     activeGames.set(gameId, gameState);

//     console.log(`Called: ${gameState.lastCalledNumber.letter}${gameState.lastCalledNumber.number} for game ${gameId}`);
//     res.status(200).json({
//         message: 'Number called successfully.',
//         lastCalledNumber: gameState.lastCalledNumber,
//         drawnNumbers: gameState.drawnNumbers,
//         gameStatus: gameState.status,
//         uncalledNumbersCount: gameState.uncalledNumbers.length
//     });
// });

// // MJ: PATCH /api/bingo-game/:gameId/finish - End a game
// app.patch('/api/bingo-game/:gameId/finish', authenticateToken, (req, res) => {
//     const { gameId } = req.params;
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }

//     gameState.status = 'ended';
//     activeGames.delete(gameId);

//     console.log(`Game ${gameId} ended successfully (in-memory cleanup).`);
//     res.status(200).json({
//         message: `Game ${gameId} has been ended.`,
//         gameId,
//         gameStatus: 'ended'
//     });
// });

// // MAe: PATCH /api/bingo-game/:gameId/disqualify-bet
// app.patch('/api/bingo-game/:gameId/disqualify-bet', authenticateToken, async (req, res) => {
//     const { gameId } = req.params;
//     const { card_id: slipId } = req.body; // Use card_id as slipId
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }
//     if (gameState.status !== 'in_progress') {
//         return res.status(400).json({ message: 'Cannot disqualify bet in a game not in progress.' });
//     }

//     const player = gameState.players.find(p => p.slipId === String(slipId));
//     if (!player) {
//         return res.status(404).json({ message: `Player with slip ID ${slipId} not found in game ${gameId}.` });
//     }

//     if (player.status === 'Disqualified') {
//         return res.status(400).json({ message: `Player with slip ID ${slipId} is already disqualified.` });
//     }

//     player.status = 'Disqualified'; // Update in-memory player status

//     // Log disqualification transaction
//     try {
//         const transaction = new Transaction({
//             userId: req.user.userId,
//             username: req.user.username,
//             gameId: gameState.gameId,
//             slipId: player.slipId,
//             type: 'disqualification',
//             amount: gameState.betAmount, // Log the bet amount as loss
//         });
//         await transaction.save();
//     } catch (dbError) {
//         console.error('Error saving disqualification transaction to DB:', dbError);
//     }

//     res.status(200).json({ message: `Player with slip ID ${slipId} has been disqualified.`, playerStatus: 'Disqualified' });
// });

// // $Ae: PATCH /api/bingo-card/:gameId/unassign/:slipId - Remove a player from a game (log cancellation)
// app.patch('/api/bingo-card/:gameId/unassign/:slipId', authenticateToken, async (req, res) => {
//     const { gameId, slipId } = req.params;
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }
//     if (gameState.status === 'in_progress') {
//         return res.status(400).json({ message: 'Cannot unassign card from a game in progress.' });
//     }

//     const initialPlayerCount = gameState.players.length;
//     const removedPlayer = gameState.players.find(player => player.slipId === slipId);

//     if (!removedPlayer) {
//         return res.status(404).json({ message: `Player ${slipId} not found in game ${gameId}.` });
//     }

//     gameState.players = gameState.players.filter(player => player.slipId !== slipId);
//     activeGames.set(gameId, gameState);

//     try {
//         const transaction = new Transaction({
//             userId: req.user.userId,
//             username: req.user.username,
//             gameId: gameState.gameId,
//             slipId: removedPlayer.slipId,
//             type: 'cancellation',
//             amount: gameState.betAmount,
//         });
//         await transaction.save();
//     } catch (dbError) {
//         console.error('Error saving cancellation transaction to DB:', dbError);
//     }

//     console.log(`Player ${slipId} unassigned from game ${gameId}.`);
//     res.status(200).json({
//         message: `Player ${slipId} unassigned successfully.`,
//         players: gameState.players,
//         gameId: gameState.gameId
//     });
// });

// // jAe: POST /api/bingo-game/:gameId/verify-bet - Dummy Check Claim (and log win transaction)
// app.post('/api/bingo-game/:gameId/verify-bet', authenticateToken, async (req, res) => {
//     const { gameId } = req.params;
//     const { card_id: slipId, sequence_index } = req.body; // Using sequence_index as a dummy check parameter
//     const gameState = activeGames.get(gameId);

//     if (!gameState) {
//         return res.status(404).json({ message: 'Game not found in active memory.' });
//     }
//     if (gameState.status !== 'in_progress') {
//         return res.status(400).json({ message: 'Game is not in progress. Claims can only be verified during an active game.' });
//     }

//     const player = gameState.players.find(p => p.slipId === String(slipId));

//     if (!player) {
//         return res.status(200).json({
//             message: `Claim for Slip ID ${slipId} is not valid. Player not found in this game.`,
//             isValid: false,
//             slipId
//         });
//     }

//     // DUMMY WIN LOGIC: For demonstration, a player wins if drawn numbers length matches sequence_index (e.g., call 11)
//     const isWinner = gameState.drawnNumbers.length >= sequence_index;

//     if (isWinner && player.status === 'Active') {
//         player.status = 'Claimed';

//         const winningAmount = gameState.betAmount * (100 / (100 - gameState.houseEdge));
//         try {
//             const transaction = new Transaction({
//                 userId: req.user.userId,
//                 username: req.user.username,
//                 gameId: gameState.gameId,
//                 slipId: player.slipId,
//                 type: 'win',
//                 amount: winningAmount,
//             });
//             await transaction.save();
//         } catch (dbError) {
//             console.error('Error saving win transaction to DB:', dbError);
//         }

//         console.log(`Dummy verification: Slip ID ${slipId} is a winner for game ${gameId}.`);
//         res.status(200).json({
//             message: `Congratulations! Ticket #${slipId} is a winner! Amount: ${winningAmount.toFixed(2)} ETB.`,
//             isValid: true,
//             slipId,
//             winningAmount: winningAmount,
//         });
//     } else if (player.status === 'Claimed') {
//         res.status(200).json({
//             message: `Ticket #${slipId} has already been claimed.`,
//             isValid: false,
//             slipId
//         });
//     } else {
//         res.status(200).json({
//             message: `Claim for Ticket #${slipId} is not valid yet (needs ${sequence_index} calls).`,
//             isValid: false,
//             slipId
//         });
//     }
// });


// // IAe: PATCH /api/bingo-game/:gameId/pattern - Update bingo game pattern (for active game)
// app.patch('/api/bingo-game/:gameId/pattern', authenticateToken, async (req, res) => {
//     const { gameId } = req.params;
//     const { pattern } = req.body;

//     if (!pattern) {
//         return res.status(400).json({ message: 'Winning pattern not provided.' });
//     }

//     const game = activeGames.get(gameId);
//     if (game) {
//         game.winningPattern = pattern; // Update in-memory game state
//         return res.status(200).json({ message: 'Game winning pattern updated.', gameId: game.gameId, winningPattern: game.winningPattern });
//     } else {
//         // If no active game, update the default cashier config.
//         // This makes the pattern change persistent for future games.
//         try {
//             const updatedConfig = await CashierConfig.findOneAndUpdate(
//                 { game_type: 'BINGO' },
//                 { winningPattern: pattern },
//                 { new: true }
//             );
//             if (updatedConfig) {
//                  return res.status(200).json({ message: 'Default winning pattern updated as no game is active.', winningPattern: updatedConfig.winningPattern });
//             }
//             return res.status(404).json({ message: 'No active game found and default config not updatable.' });
//         } catch (error) {
//             console.error('Error updating default pattern:', error);
//             res.status(500).json({ message: 'Failed to update default winning pattern.' });
//         }
//     }
// });

// // NAe: GET /api/users/profile
// app.get('/api/users/profile', authenticateToken, async (req, res) => {
//     try {
//         const user = await User.findById(req.user.userId).select('-password');
//         if (!user) {
//             return res.status(404).json({ message: 'User not found.' });
//         }
//         res.status(200).json({ profile: user });
//     } catch (error) {
//         console.error('Error fetching user profile:', error);
//         res.status(500).json({ message: 'Failed to retrieve user profile.' });
//     }
// });

// // kAe: GET /api/cashier-config
// app.get('/api/cashier-config', authenticateToken, async (req, res) => {
//     const { game_type } = req.query;
//     if (game_type !== 'BINGO') {
//         return res.status(400).json({ message: 'Invalid game_type specified.' });
//     }
//     try {
//         const config = await CashierConfig.findOne({ game_type });
//         if (!config) {
//             return res.status(404).json({ message: 'Cashier configuration not found for BINGO.' });
//         }
//         res.status(200).json(config);
//     } catch (error) {
//         console.error('Error fetching cashier config:', error);
//         res.status(500).json({ message: 'Failed to retrieve cashier configuration.' });
//     }
// });

// // PAe: PATCH /api/cashier-config
// app.patch('/api/cashier-config', authenticateToken, async (req, res) => {
//     const { game_type, betAmount, houseEdge, winningPattern } = req.body;
//     if (game_type !== 'BINGO') {
//         return res.status(400).json({ message: 'Invalid game_type specified.' });
//     }

//     try {
//         const updatedConfig = await CashierConfig.findOneAndUpdate(
//             { game_type },
//             { betAmount, houseEdge, winningPattern },
//             { new: true, upsert: true, runValidators: true }
//         );
//         res.status(200).json({ message: 'Cashier configuration updated successfully.', config: updatedConfig });
//     } catch (error) {
//         console.error('Error updating cashier config:', error);
//         res.status(500).json({ message: 'Failed to update cashier configuration.' });
//     }
// });

// // LAe: GET /api/cashiers/summary
// app.get('/api/cashiers/summary', authenticateToken, async (req, res) => {
//     const { from, to } = req.query;
//     const { username, userId } = req.user;

//     if (!from || !to) {
//         return res.status(400).json({ message: 'Missing "from" and "to" date parameters.' });
//     }

//     const startDate = new Date(from);
//     const endDate = new Date(new Date(to).setHours(23, 59, 59, 999));

//     if (isNaN(startDate) || isNaN(endDate)) {
//         return res.status(400).json({ message: 'Invalid date format for "from" or "to".' });
//     }

//     try {
//         const transactions = await Transaction.find({
//             userId: userId,
//             timestamp: { $gte: startDate, $lte: endDate }
//         });

//         let totalDeposits = 0;
//         let totalBets = 0;
//         let totalWins = 0;
//         let totalCancellations = 0;
//         let totalWithdrawals = 0;

//         transactions.forEach(t => {
//             switch (t.type) {
//                 case 'deposit': totalDeposits += t.amount; break;
//                 case 'bet': totalBets += t.amount; break;
//                 case 'win': totalWins += t.amount; break;
//                 case 'withdrawal': totalWithdrawals += t.amount; break;
//                 case 'cancellation': totalCancellations += t.amount; break;
//             }
//         });

//         const netGameProfit = totalBets - totalWins;
//         const webDeveloperSharePercentage = 0.15;
//         const webDeveloperShare = netGameProfit * webDeveloperSharePercentage;
//         const retailerShare = netGameProfit * (1 - webDeveloperSharePercentage);
//         const netCashFlow = totalDeposits + totalBets - totalWins - totalCancellations - totalWithdrawals;

//         res.status(200).json({
//             retailUser: username,
//             fromDate: startDate.toISOString(),
//             toDate: endDate.toISOString(),
//             startBalance: 0,
//             deposits: totalDeposits,
//             bets: totalBets,
//             cancellations: totalCancellations,
//             redeemed: totalWins,
//             withdraws: totalWithdrawals,
//             endBalance: netCashFlow,
//             netGameProfit: netGameProfit,
//             retailerShare: retailerShare,
//             webDeveloperShare: webDeveloperShare,
//             message: "Cashier summary generated."
//         });

//     } catch (error) {
//         console.error('Error generating cashier summary:', error);
//         res.status(500).json({ message: 'Failed to generate cashier summary.' });
//     }
// });


// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });