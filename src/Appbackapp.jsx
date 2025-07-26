// --- START OF FILE App.jsx ---
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

// Import all functions from your new apiService
import {
  getBingoCardDefault, // Not used in App.jsx directly, but good to know it exists
  activateTickets,
  getCashierConfig, // Not used in App.jsx directly, but good to know it exists
  updateCashierConfig, // Not used in App.jsx directly, but good to know it exists
  updateGamePattern,
  finishGame,
  disqualifyBet,
  unassignBingoCard,
  generateBingoGame, // Replaces start-game
  getUserProfile, // Not used in App.jsx directly, but good to know it exists
  getCashierSummary, // Used in ReportsModal
  verifyBet, // Used in CheckClaimModal
  loginUser, // Replaces axios.post for login
  registerAdminWithBalance, // Replaces axios.post for admin registration
  callNextNumber as apiCallNextNumber // Alias to avoid name collision with local callNextNumber
} from './api/apiService';


import Navbar from './components/Navbar';
import SettingsDrawer from './components/SettingsDrawer';
import CheckClaimModal from './components/CheckClaimModal';
import CallHistoryModal from './components/CallHistoryModal';
import LogoutModal from './components/LogoutModal';
import ReportsModal from './components/ReportsModal'; 
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';


// Dummy audio paths for demonstration. Replace with actual paths to your audio files.
// Ensure these paths correctly point to your audio files in the public or assets folder.
const bingoAudioMap = {
  // ... (keep your existing bingoAudioMap)
  'B1': '/audio/G49.mp3', 'B2': '/audio/G49.mp3', 'B3': '/audio/G49.mp3',
  'B4': '/audio/G49.mp3', 'B5': '/audio/G49.mp3', 'B6': '/audio/G49.mp3',
  'B7': '/audio/G49.mp3', 'B8': '/audio/G49.mp3', 'B9': '/audio/G49.mp3',
  'B10': '/audio/G49.mp3', 'B11': '/audio/G49.mp3', 'B12': '/audio/G49.mp3',
  'B13': '/audio/G49.mp3', 'B14': '/audio/G49.mp3', 'B15': '/audio/G49.mp3',
  'I16': '/audio/G49.mp3', 'I17': '/audio/G49.mp3', 'I18': '/audio/G49.mp3',
  'I19': '/audio/G49.mp3', 'I20': '/audio/G49.mp3', 'I21': '/audio/G49.mp3',
  'I22': '/audio/G49.mp3', 'I23': '/audio/G49.mp3', 'I24': '/audio/G49.mp3',
  'I25': '/audio/G49.mp3', 'I26': '/audio/G49.mp3', 'I27': '/audio/G49.mp3',
  'I28': '/audio/G49.mp3', 'I29': '/audio/G49.mp3', 'I30': '/audio/G49.mp3',
  'N31': '/audio/G49.mp3', 'N32': '/audio/G49.mp3', 'N33': '/audio/G49.mp3',
  'N34': '/audio/G49.mp3', 'N35': '/audio/G49.mp3', 'N36': '/audio/G49.mp3',
  'N37': '/audio/G49.mp3', 'N38': '/audio/G49.mp3', 'N39': '/audio/G49.mp3',
  'N40': '/audio/G49.mp3', 'N41': '/audio/G49.mp3', 'N42': '/audio/G49.mp3',
  'N43': '/audio/G49.mp3', 'N44': '/audio/G49.mp3', 'N45': '/audio/G49.mp3',
  'G46': '/audio/G49.mp3', 'G47': '/audio/G49.mp3', 'G48': '/audio/G49.mp3',
  'G49': '/audio/G49.mp3', 'G50': '/audio/G49.mp3', 'G51': '/audio/G49.mp3',
  'G52': '/audio/G49.mp3', 'G53': '/audio/G49.mp3', 'G54': '/audio/G49.mp3',
  'G55': '/audio/G49.mp3', 'G56': '/audio/G49.mp3', 'G57': '/audio/G49.mp3',
  'G58': '/audio/G49.mp3', 'G59': '/audio/G49.mp3', 'G60': '/audio/G49.mp3',
  'O61': '/audio/G49.mp3', 'O62': '/audio/G49.mp3', 'O63': '/audio/G49.mp3',
  'O64': '/audio/G49.mp3', 'O65': '/audio/G49.mp3', 'O66': '/audio/G49.mp3',
  'O67': '/audio/G49.mp3', 'O68': '/audio/G49.mp3', 'O69': '/audio/G49.mp3',
  'O70': '/audio/G49.mp3', 'O71': '/audio/G49.mp3', 'O72': '/audio/G49.mp3',
  'O73': '/audio/G49.mp3', 'O74': '/audio/G49.mp3', 'O75': '/audio/G49.mp3',
};


const getBingoLetter = (num) => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};

const playBingoSound = (number) => {
  const letter = getBingoLetter(number);
  const key = `${letter}${number}`;
  const audioPath = bingoAudioMap[key];

  if (audioPath) {
    const audio = new Audio(audioPath);
    audio.play().catch(e => console.error("Error playing audio:", e));
  } else {
    console.warn(`No audio found for ${key}`);
  }
};


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegisterPage, setShowRegisterPage] = useState(false); // State to toggle between Login/Register

  const [gameId, setGameId] = useState(null);
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle', 'starting', 'waiting_for_players', 'in_progress', 'ended'
  const [gameSettings, setGameSettings] = useState({
    betAmount: 10, // Initializing with numbers is good
    houseEdge: 15, // Initializing with numbers is good
    winningPattern: 'anyTwoLines',
  });
  const [uncalledNumbersCount, setUncalledNumbersCount] = useState(0); // For displaying remaining count
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastCalledNumber, setLastCalledNumber] = useState(null);
  const [players, setPlayers] = useState([]); // Players added to the current game session
  const [selectedTickets, setSelectedTickets] = useState([]); // Tickets selected in TicketSelectionPanel

  const settingsDrawerRef = useRef(null);
  const [timeInterval, setTimeInterval] = useState(3);
  const [printDefaultCards, setPrintDefaultCards] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [audibleCaller, setAudibleCaller] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('red');
  const [selectedDisplayLanguage, setSelectedDisplayLanguage] = useState('English');
  const [selectedAudioLanguage, setSelectedAudioLanguage] = useState('Amharic Male');

  const [isCheckClaimModalOpen, setIsCheckClaimModalOpen] = useState(false);
  const [isCallHistoryModalOpen, setIsCallHistoryModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false); 


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // --- Handlers for Settings Drawer ---
  const handleTimeIntervalChange = useCallback((value) => setTimeInterval(value), []);
  const handlePrintDefaultCardsChange = useCallback((value) => setPrintDefaultCards(value), []);
  const handleManualModeChange = useCallback((value) => setManualMode(value), []);
  const handleAudibleCallerChange = useCallback((value) => setAudibleCaller(value), []);
  const handleThemeChange = useCallback((event) => setSelectedTheme(event.target.value), []);
  const handleDisplayLanguageChange = useCallback((event) => setSelectedDisplayLanguage(event.target.value), []);
  const handleAudioLanguageChange = useCallback((event) => setSelectedAudioLanguage(event.target.value), []);

  const openSettingsDrawer = useCallback(() => {
    if (settingsDrawerRef.current) {
      settingsDrawerRef.current.checked = true;
    }
  }, []);
  const closeSettingsDrawer = useCallback(() => {
    if (settingsDrawerRef.current) {
      settingsDrawerRef.current.checked = false;
    }
  }, []);

  // --- Handlers for Modals ---
  const openCheckClaimModal = useCallback(() => setIsCheckClaimModalOpen(true), []);
  const closeCheckClaimModal = useCallback(() => setIsCheckClaimModalOpen(false), []);

  const openCallHistoryModal = useCallback(() => setIsCallHistoryModalOpen(true), []);
  const closeCallHistoryModal = useCallback(() => setIsCallHistoryModalOpen(false), []);

  const openLogoutModal = useCallback(() => setIsLogoutModalOpen(true), []);
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    console.log('User logged out.');
    // Reset all game states on logout
    setGameStatus('idle');
    setGameId(null);
    setDrawnNumbers([]);
    setLastCalledNumber(null);
    setPlayers([]);
    setUncalledNumbersCount(0);
    setSelectedTickets([]);
  }, []);

  // Handlers for Reports Modal
  const openReportsModal = useCallback(() => setIsReportsModalOpen(true), []);
  const closeReportsModal = useCallback(() => setIsReportsModalOpen(false), []);

  // Handlers for Login/Register Pages
  const handleLogin = useCallback(async (username, password) => {
    try {
      const response = await loginUser(username, password); // Use apiService function
      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
      console.log('Login successful:', response.data.message);
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message || 'Invalid credentials');
      alert(error.response?.data?.message || 'Login failed!');
    }
  }, []);

  const handleRegister = useCallback(async (username, password, initialBalance) => {
    try {
      // NOTE: This endpoint is for initial admin setup without auth.
      // In a real app, general user registration would be different.
      const response = await registerAdminWithBalance(username, password, initialBalance); // Use apiService function
      alert(response.data.message);
      setShowRegisterPage(false); // Switch back to login page after successful registration
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      alert(error.response?.data?.message || 'Registration failed!');
    }
  }, []);

  const handleSwitchToLogin = useCallback(() => setShowRegisterPage(false), []);
  const handleSwitchToRegister = useCallback(() => setShowRegisterPage(true), []);


  // FIX: handleGameSettingChange now handles the type conversion based on settingName
  const handleGameSettingChange = useCallback((settingName, value) => {
    setGameSettings(prev => {
      let newValue = value;
      // Perform number conversion only for betAmount and houseEdge
      if (settingName === 'betAmount' || settingName === 'houseEdge') {
        if (value === '') {
          newValue = ''; // Allow empty string for numeric inputs
        } else {
          const numValue = Number(value);
          newValue = isNaN(numValue) ? '' : numValue; // Ensure it's a number or empty string
        }
      }
      // For winningPattern, value is already a string from HomePage
      // console.log(`App.jsx: Setting ${settingName} to`, newValue, `(was ${prev[settingName]})`); // For debugging
      return {
        ...prev,
        [settingName]: newValue
      };
    });
  }, []);

  // handleStartGame now only responsible for transitioning to 'in_progress' and fetching initial game state (if not already set)
  const handleStartGame = useCallback(async () => {
    if (!gameId) {
        alert("Game not initialized. Please activate tickets first which will start a game.");
        return;
    }

    // If game is already waiting for players and Start Game button is pressed, transition to in_progress
    if (gameStatus === 'waiting_for_players') {
        try {
            // The actual status transition on backend happens with first call-number
            setGameStatus('in_progress'); // Client-side state transition
            console.log(`Game ${gameId} transitioned to in_progress (client-side).`);
        } catch (error) {
            console.error('Error transitioning game to in_progress:', error.response?.data?.message || error.message);
            alert('Failed to start game. Please try again.');
        }
    } else {
        console.log(`Game is already in status: ${gameStatus}. Cannot start.`);
    }
  }, [gameId, gameStatus]);


  const callNextNumber = useCallback(async () => {
    if (!gameId) {
      console.error('No game ID found to call numbers.');
      return;
    }

    try {
      const response = await apiCallNextNumber(gameId); // Use apiService function
      const { lastCalledNumber, drawnNumbers, gameStatus: newGameStatus, uncalledNumbersCount } = response.data;
      setLastCalledNumber(lastCalledNumber);
      setDrawnNumbers(drawnNumbers);
      setUncalledNumbersCount(uncalledNumbersCount);
      setGameStatus(newGameStatus);

      if (audibleCaller && lastCalledNumber) {
        playBingoSound(lastCalledNumber.number);
      }

    } catch (error) {
      console.error('Error calling next number:', error.response?.data?.message || error.message);
      // Specific error handling for game not in progress
      if (error.response && error.response.status === 400 &&
          (error.response.data.message.includes('game is not in progress') ||
           error.response.data.message.includes('Cannot start calling numbers without any players.'))) {
          alert("Game is not yet in progress. Please ensure tickets are activated and click 'Start Game'.");
          setGameStatus('waiting_for_players'); // Keep status in sync or revert as appropriate
      } else if (error.response && error.response.data.message.includes('All numbers called! Game ended.')) {
          setGameStatus('ended');
      }
    }
  }, [gameId, audibleCaller]);

  // handleAddPlayers logic is crucial for starting a new game if none is active, then adding players
  const handleAddPlayers = useCallback(async (newTickets) => {
    if (selectedTickets.length === 0) {
        alert('Please select tickets to activate.');
        return;
    }

    let currentOrNewGameId = gameId;

    // Phase 1: If no game is active (gameId is null or status is idle/ended), start a new game first
    if (!currentOrNewGameId || gameStatus === 'idle' || gameStatus === 'ended') {
        try {
            const startGameResponse = await generateBingoGame(gameSettings); // Use apiService function
            currentOrNewGameId = startGameResponse.data.gameId;
            setGameId(currentOrNewGameId);
            setGameStatus(startGameResponse.data.gameState.status); // Should be 'waiting_for_players'
            setUncalledNumbersCount(75); // Total numbers in Bingo, before any are called
            setPlayers([]); // Clear players from previous game if new game started
            console.log('New game started automatically by ticket activation:', currentOrNewGameId);

        } catch (error) {
            console.error('Error starting new game automatically:', error.response?.data?.message || error.message);
            alert('Failed to start a new game. Please try again after logging in.');
            setGameStatus('idle');
            return; // Stop execution if game couldn't start
        }
    }

    // Phase 2: Add players to the current (or newly started) game
    try {
        // Here, the backend `activateTickets` doesn't currently take gameId in path,
        // it assumes one active game. If you have multiple users/concurrent games,
        // you'd need to explicitly pass gameId in the activateTickets API.
        const response = await activateTickets(selectedTickets); // Use apiService function
        setPlayers(response.data.players); // Update players state with backend response
        setSelectedTickets([]); // Clear selected tickets after activation
        console.log('Tickets activated and players added to game:', response.data.players);
        alert(`Successfully activated ${selectedTickets.length} tickets and added players!`);

    } catch (error) {
        console.error('Error adding players:', error.response?.data?.message || error.message);
        alert('Failed to add players. Ensure the game is in a "waiting_for_players" state or that a game is running.');
    }
  }, [gameId, gameSettings, selectedTickets, gameStatus]);

  const handleRemoveSlip = useCallback(async (slipId) => {
    if (!gameId) {
      alert('No active game to remove players from.');
      return;
    }
    try {
        const response = await unassignBingoCard(gameId, slipId); // Use apiService function
        setPlayers(response.data.players); // Update players state with backend response
        console.log('Player removed:', slipId);
    } catch (error) {
        console.error('Error removing player:', error.response?.data?.message || error.message);
        alert('Failed to remove player. Game must be in "waiting_for_players" state.');
    }
  }, [gameId]);

  const handleEndGame = useCallback(async () => {
    if (!gameId) {
      alert('No game currently in progress to end.');
      return;
    }
    if (!window.confirm("Are you sure you want to end the current game? This cannot be undone.")) {
        return;
    }
    try {
        await finishGame(gameId); // Use apiService function
        setGameStatus('idle'); // Back to idle state
        setGameId(null);
        setDrawnNumbers([]);
        setLastCalledNumber(null);
        setPlayers([]); // Clear players for next game
        setUncalledNumbersCount(0);
        setSelectedTickets([]); // Clear selected tickets for new game
        console.log('Game ended successfully.');
        alert("Game has been ended!");
    } catch (error) {
        console.error('Error ending game:', error.response?.data?.message || error.message);
        alert('Failed to end game.');
    }
  }, [gameId]);


  // Handle automatic number calling if not in manual mode
  useEffect(() => {
    let timer;
    if (gameStatus === 'in_progress' && !manualMode) {
      if (uncalledNumbersCount > 0) {
        timer = setTimeout(callNextNumber, timeInterval * 1000);
      } else if (uncalledNumbersCount === 0 && drawnNumbers.length === 75) {
        setGameStatus('ended'); // All numbers drawn, transition to 'ended'
      }
    }
    return () => clearTimeout(timer);
  }, [gameStatus, manualMode, drawnNumbers.length, timeInterval, uncalledNumbersCount, callNextNumber]);


  return (
    <div id="root">
      <div className="Toastify"></div>

      {/* Pass verifyBet from apiService to CheckClaimModal */}
      <CheckClaimModal isOpen={isCheckClaimModalOpen} onClose={closeCheckClaimModal} gameId={gameId} verifyBet={verifyBet} />
      <CallHistoryModal isOpen={isCallHistoryModalOpen} onClose={closeCallHistoryModal} />
      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirmLogout={handleLogout} />
      {/* Pass getCashierSummary from apiService to ReportsModal */}
      <ReportsModal isOpen={isReportsModalOpen} onClose={closeReportsModal} getCashierSummary={getCashierSummary} />

      {isLoggedIn ? (
        <div className="h-screen w-full overflow-hidden">
          <div className="root-layout h-screen w-screen overflow-x-hidden">
            <main className="h-full">
              <div className="h-full w-full overflow-hidden bg-gradient-to-br from-dama-red-dark via-dama-red-mid to-dama-red-light">
                <Navbar
                  onOpenReports={openReportsModal}
                  onOpenSettings={openSettingsDrawer}
                  onOpenLogout={openLogoutModal}
                />
                <HomePage
                  gameSettings={gameSettings}
                  setGameSettings={handleGameSettingChange}
                  onStartGame={handleStartGame}
                  gameId={gameId}
                  gameStatus={gameStatus}
                  drawnNumbers={drawnNumbers}
                  lastCalledNumber={lastCalledNumber}
                  onCallNextNumber={callNextNumber}
                  players={players} // Pass players state
                  setPlayers={setPlayers} // Pass setter for local updates (e.g., search/pagination in AddPlayersPanel)
                  onAddPlayers={handleAddPlayers} // Pass handler for activating tickets
                  onRemoveSlip={handleRemoveSlip} // Pass handler for removing slips
                  onEndGame={handleEndGame} // Pass handler for ending game
                  selectedTickets={selectedTickets} // Pass selected tickets
                  setSelectedTickets={setSelectedTickets} // Pass setter for selected tickets
                  uncalledNumbersCount={uncalledNumbersCount} // Pass for display
                  onOpenCheckClaimModal={openCheckClaimModal}
                />
              </div>
              <SettingsDrawer
                settingsDrawerRef={settingsDrawerRef}
                timeInterval={timeInterval}
                setTimeInterval={handleTimeIntervalChange}
                printDefaultCards={printDefaultCards}
                setPrintDefaultCards={handlePrintDefaultCardsChange}
                manualMode={manualMode}
                setManualMode={handleManualModeChange}
                audibleCaller={audibleCaller}
                setAudibleCaller={handleAudibleCallerChange}
                selectedTheme={selectedTheme}
                setSelectedTheme={handleThemeChange}
                selectedDisplayLanguage={selectedDisplayLanguage}
                setSelectedDisplayLanguage={handleDisplayLanguageChange}
                selectedAudioLanguage={selectedAudioLanguage}
                setSelectedAudioLanguage={handleAudioLanguageChange}
                closeDrawer={closeSettingsDrawer}
              />
            </main>
          </div>
        </div>
      ) : (
        // Conditionally render LoginPage or RegisterPage
        showRegisterPage ? (
          <RegisterPage onRegister={handleRegister} onSwitchToLogin={handleSwitchToLogin} />
        ) : (
          <LoginPage onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />
        )
      )}
    </div>
  );
}

export default App;