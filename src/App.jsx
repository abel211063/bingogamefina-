// --- START OF FILE App.jsx ---
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

import {
  activateTickets,
  updateGamePattern,
  finishGame,
  disqualifyBet,
  unassignBingoCard,
  generateBingoGame,
  getCashierSummary,
  verifyBet,
  loginUser,
  registerAdminWithBalance,
  callNextNumber as apiCallNextNumber,
  registerRetailUser,
  getAllRetailUsers,
  getRetailUserBalance,
  rechargeRetailUser,
  updateRetailUserStatus,
  getUserProfile
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
import AdminDashboard from './pages/AdminDashboard';

import Swal from 'sweetalert2'

const audioLanguageMap = {
  'Amharic Male': '/audio/amharic_male/',
  'Amharic Female': '/audio/amharic_female/',
  'Afaan Oromoo Male': '/audio/afaan_oromoo_male/',
  'Afaan Oromoo Female': '/audio/afaan_oromoo_female/',
  'Tigrinya Male': '/audio/tigrinya_male/',
  'Tigrinya Female': '/audio/tigrinya_female/',
  'English Male': '/audio/english_male/'
};

const getBingoAudioFilename = (number) => {
  const letter = getBingoLetter(number);
  return `${letter}${number}.mp3`;
};

const getBingoLetter = (num) => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};

const playBingoSound = (number, selectedAudioLanguage) => {
  const basePath = audioLanguageMap[selectedAudioLanguage];
  const filename = getBingoAudioFilename(number);

  if (basePath) {
    const audioPath = `${basePath}${filename}`;
    const audio = new Audio(audioPath);
    audio.play().catch(e => console.error(`Error playing audio ${audioPath}:`, e));
  } else {
    console.warn(`No base audio path found for language: ${selectedAudioLanguage}`);
  }
};


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showRegisterPage, setShowRegisterPage] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);

  const [gameId, setGameId] = useState(null);
  const [gameStatus, setGameStatus] = useState('idle'); // Can be 'idle', 'waiting_for_players', 'in_progress', 'claims_only', 'ended'
  const [gameSettings, setGameSettings] = useState({
    betAmount: 10,
    houseEdge: 15,
    winningPattern: 'anyTwoLines',
  });
  const [uncalledNumbersCount, setUncalledNumbersCount] = useState(0);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [lastCalledNumber, setLastCalledNumber] = useState(null);
  const gameTimerRef = useRef(null);
  const [players, setPlayers] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);

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

  // This state is now mostly managed by gameStatus, but kept for clarity during transitions
  const [isGamePausedForClaim, setIsGamePausedForClaim] = useState(false);



  // NEW function to refresh user profile including balance and isActive status
const refreshUserProfile = useCallback(async () => {
  // Only try to refresh if user is logged in and is a retail user
  if (!isLoggedIn || userRole !== 'retail') return;
  try {
    const response = await getUserProfile(); // Call the API service
    setUserProfile(response.data.profile); // Update state with the full profile
  } catch (error) {
    console.error('Failed to refresh user profile:', error.response?.data?.message || error.message);
    // Handle token expiration or other severe errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      handleLogout(); // Force logout if unauthorized
    }
  }
}, [isLoggedIn, userRole]); // Dependencies: only re-create if these change

 
// MODIFIED: useEffect hook for initial login check
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setIsLoggedIn(true);
      setUserRole(decodedToken.role);
      setCurrentUsername(decodedToken.username); // Directly set from token for immediate display

      // NEW: If the user is a retail user, refresh their full profile
      if (decodedToken.role === 'retail') {
          refreshUserProfile(); // Fetch full profile for retail users
      }

    } catch (e) {
      console.error("Failed to decode token:", e);
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setUserRole(null);
      setCurrentUsername(null);
      setUserProfile(null); // NEW: Reset userProfile on decode failure
    }
  }
  else {
   setCurrentUsername(null);
   setUserProfile(null); // NEW: Reset userProfile if no token
   }
}, [selectedTheme, refreshUserProfile]); // Added refreshUserProfile to dependencies

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }, [selectedTheme]);


  const handleTimeIntervalChange = useCallback((value) => setTimeInterval(value), []);
  const handlePrintDefaultCardsChange = useCallback((value) => setPrintDefaultCards(value), []);
  const handleManualModeChange = useCallback((value) => setManualMode(value), []);
  const handleAudibleCallerChange = useCallback((value) => setAudibleCaller(value), []);
  const handleThemeChange = useCallback((value) => setSelectedTheme(value), []);
  const handleDisplayLanguageChange = useCallback((value) => setSelectedDisplayLanguage(value), []);
  const handleAudioLanguageChange = useCallback((value) => setSelectedAudioLanguage(value), []);


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

  // MODIFIED: Pause game AND clear timer when Check Claim modal opens
  const openCheckClaimModal = useCallback(() => {
    setIsCheckClaimModalOpen(true);
    if (gameStatus === 'in_progress' || gameStatus === 'claims_only') { // Pause always if game active or in claims mode
      setIsGamePausedForClaim(true); // Frontend pause flag
      // CRITICAL FIX: Immediately clear any pending auto-call to prevent race condition
      if (gameTimerRef.current) {
        clearTimeout(gameTimerRef.current);
        gameTimerRef.current = null;
      }
    }
  }, [gameStatus, gameTimerRef]);

  // MODIFIED: Resume game only if gameStatus is 'in_progress' and not already paused by a winner
  const closeCheckClaimModal = useCallback(() => {
     setIsCheckClaimModalOpen(false);
     // If game is in progress and was paused ONLY for the modal (i.e., not by a confirmed win changing status to 'claims_only'), resume.
     if (gameStatus === 'in_progress' && isGamePausedForClaim) { 
       setIsGamePausedForClaim(false); 
     }
   }, [gameStatus, isGamePausedForClaim]);

  const openCallHistoryModal = useCallback(() => setIsCallHistoryModalOpen(true), []);
  const closeCallHistoryModal = useCallback(() => setIsCallHistoryModalOpen(false), []);

  const openLogoutModal = useCallback(() => setIsLogoutModalOpen(true), []);
 

  // MODIFIED: handleLogout to reset userProfile
const handleLogout = useCallback(() => {
  localStorage.removeItem('token');
  setIsLoggedIn(false);
  setUserRole(null);
  setCurrentUsername(null);
  setUserProfile(null); // NEW: Reset user profile on logout
  console.log('User logged out.');
  // Reset game state on logout
  setGameStatus('idle');
  setGameId(null);
  setDrawnNumbers([]);
  setLastCalledNumber(null);
  setPlayers([]); // CRITICAL: Clear players array for the current game
  setUncalledNumbersCount(0);
  setSelectedTickets([]);

  if (gameTimerRef.current) { // Clear any pending timers
    clearTimeout(gameTimerRef.current);
    gameTimerRef.current = null;
  }
  setIsGamePausedForClaim(false); // Ensure pause state is reset on logout
}, []);

  const openReportsModal = useCallback(() => setIsReportsModalOpen(true), []);
  const closeReportsModal = useCallback(() => setIsReportsModalOpen(false), []);

 // MODIFIED: handleLogin to fetch user profile for retail users
const handleLogin = useCallback(async (username, password) => {
  try {
    const response = await loginUser(username, password);
    localStorage.setItem('token', response.data.token);
    setIsLoggedIn(true);
    setCurrentUsername(response.data.user.username);
    setUserRole(response.data.user.role);
    // NEW: After successful login, refresh the full profile if retail
    if (response.data.user.role === 'retail') {
        await refreshUserProfile(); // Ensure profile is up-to-date immediately
    }
    console.log('Login successful:', response.data.message);
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message || 'Invalid credentials');
     Swal.fire({
      title: error.response?.data?.message || 'Login failed!',
      icon: "error"
    });
  }
}, [refreshUserProfile]); // Dependency for useCallback

  const handleRegister = useCallback(async (username, password, initialBalance) => {
    try {
      const response = await registerAdminWithBalance(username, password, initialBalance);
     Swal.fire({
       title: response.data.message,
       icon: "success"
     });
      setShowRegisterPage(false);
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
       Swal.fire({
        title: error.response?.data?.message || 'Registration failed!',
        icon: "error"
      });
    }
  }, []);

  const handleSwitchToLogin = useCallback(() => setShowRegisterPage(false), []);
  const handleSwitchToRegister = useCallback(() => setShowRegisterPage(true), []);


  const handleGameSettingChange = useCallback((settingName, value) => {
    setGameSettings(prev => {
      let newValue = value;
      if (settingName === 'betAmount' || settingName === 'houseEdge') {
        if (value === '') {
          newValue = '';
        } else {
          const numValue = Number(value);
          newValue = isNaN(numValue) ? '' : numValue;
        }
      }
      return {
        ...prev,
        [settingName]: newValue
      };
    });
  }, []);

  // MODIFIED: Prevent starting game if already in claims_only mode
  const handleStartGame = useCallback(async () => {
      if (!gameId) {
        Swal.fire({
          title: "No game initialized. Please activate tickets first to start a game.",
          icon: "error"
        });

          return;
      }
      if (gameStatus === 'claims_only') {
          Swal.fire({
            title: "Game has a winner(s). Please click 'End Game' to start a new round.",
            icon: "info"
          });
          return;
      }

      if (gameStatus === 'waiting_for_players') {
          setGameStatus('in_progress');
          setIsGamePausedForClaim(false); // Ensure game is not paused if starting
          console.log(`Game ${gameId} client-side status set to 'in_progress'.`);
      } else {
          console.log(`Game is already in status: ${gameStatus}. Cannot start.`);
      }
  }, [gameId, gameStatus]);


  const callNextNumber = useCallback(async () => {
    if (!gameId) {
      console.error('No game ID found to call numbers.');
      return;
    }
    // Prevent calling if game is in claims_only or already ended
    if (gameStatus !== 'in_progress') {
        console.warn(`Attempted to call next number while game status is ${gameStatus}. Aborting.`);
        return;
    }

    try {
      const response = await apiCallNextNumber(gameId);
      const { lastCalledNumber, drawnNumbers, gameStatus: newGameStatus, uncalledNumbersCount } = response.data;
      setLastCalledNumber(lastCalledNumber);
      setDrawnNumbers(drawnNumbers);
      setUncalledNumbersCount(uncalledNumbersCount);
      setGameStatus(newGameStatus); // Backend might signal 'ended' if all numbers exhausted

      if (audibleCaller && lastCalledNumber) {
        playBingoSound(lastCalledNumber.number, selectedAudioLanguage);
      }

    } catch (error) {
      console.error('Error calling next number:', error.response?.data?.message || error.message);
      if (error.response && error.response.status === 400 &&
          (error.response.data.message.includes('game is not in progress') ||
           error.response.data.message.includes('Cannot start calling numbers without any players.'))) {
           Swal.fire({
             title: "Game is not yet in progress. Please ensure tickets are activated and click 'Start Game'.",
             icon: "info"
           }); 
          setGameStatus('waiting_for_players');
          setIsGamePausedForClaim(false); // Ensure not paused if waiting
      } else if (error.response && error.response.data.message.includes('All numbers called! Game ended.')) {
          setGameStatus('ended'); // Explicitly set to ended if server says all numbers called
          setIsGamePausedForClaim(false); // Ensure not paused if ended
      } else if (error.response?.status === 404) {
        Swal.fire({
          title: "The game session was lost. Please start a new game.",
          icon: "error"
        });
        setGameStatus('idle');
        setGameId(null);
        setPlayers([]);
        setDrawnNumbers([]);
        setIsGamePausedForClaim(false); // Ensure not paused if reset
      }
    }
  }, [gameId, audibleCaller, selectedAudioLanguage, gameStatus]); // Added gameStatus to dependencies

   // handleAddPlayers logic: Responsible for ensuring a game exists and adding players to it.
// From App.jsx

  // handleAddPlayers logic: Responsible for ensuring a game exists and adding players to it.
const handleAddPlayers = useCallback(async (selectedTicketsForActivation, customPatternDefinition) => {
    if (selectedTicketsForActivation.length === 0) {
      Swal.fire({
        title: "Please select tickets to activate.",
        icon: "warning"
      });
        return;
    }
    // Prevent adding players if game has already won or is in progress
    if (gameStatus === 'in_progress' || gameStatus === 'claims_only') {
      Swal.fire({
        title: "Cannot activate tickets while a game is already in progress or has a winner. Please end the current game first.",
        icon: "info"
      });
        return;
    }

    let gameToActOnId = gameId; // Use the current gameId from state

    // If there's no existing game ID, or the current game is explicitly 'idle' or 'ended',
    // then we need to generate a brand new game.
    // If gameStatus is 'waiting_for_players', gameToActOnId (which is gameId) will already be set,
    // and this condition will be false, leading to the existing game being used.
    if (!gameToActOnId || gameStatus === 'idle' || gameStatus === 'ended') { 
        try {
            const gameSettingsToSend = {
                betAmount: gameSettings.betAmount,
                houseEdge: gameSettings.houseEdge,
                winningPattern: gameSettings.winningPattern,
                // Pass customPatternDefinition only if winningPattern is 'custom'
                ...(gameSettings.winningPattern === 'custom' && { customPatternDefinition: customPatternDefinition })
            };

            const startGameResponse = await generateBingoGame(gameSettingsToSend);
            gameToActOnId = startGameResponse.data.gameId; // Update gameToActOnId with the new game's ID
            setGameId(gameToActOnId); // Update component state with the new game ID
            setGameStatus(startGameResponse.data.gameState.status); // Set status to 'waiting_for_players'
            setUncalledNumbersCount(75); 
            setPlayers([]); 
            setDrawnNumbers([]); 
            setLastCalledNumber(null); 
            setIsGamePausedForClaim(false); 
            console.log('New game generated automatically for ticket activation:', gameToActOnId);

        } catch (error) {
            console.error('Error generating new game automatically:', error.response?.data?.message || error.message);
            Swal.fire({
              title: "Failed to start a new game. Please try again after logging in.",
              icon: "error"
            });
            setGameStatus('idle');
            return;
        }
    } 
    // If we reach here and `gameStatus` is 'waiting_for_players', `gameToActOnId` already holds the correct `gameId`.
    // No explicit `else if (gameStatus === 'waiting_for_players')` block is needed here,
    // as the logic flows correctly to the `activateTickets` step below.


    // This part will activate tickets for the gameToActOnId that was either
    // newly generated OR the existing 'waiting_for_players' game.
    try {
        const response =await activateTickets(gameToActOnId, selectedTicketsForActivation);;
        setPlayers(response.data.players);
        setSelectedTickets([]);
        console.log('Tickets activated and players added to game:', response.data.players);
        Swal.fire({
          title: `Successfully activated ${selectedTicketsForActivation.length} tickets and added players!`,
          icon: "success"
        });

    } catch (error) {
        console.error('Error adding players:', error.response?.data?.message || error.message);
        if (error.response?.status === 404 && error.response?.data?.message.includes('Game not found')) {
          
            Swal.fire({
            title: "The game session was lost before adding players. Please try activating tickets again.",
            icon: "info"
          });
            setGameStatus('idle');
            setGameId(null);
            setPlayers([]);
            setDrawnNumbers([]);
            setIsGamePausedForClaim(false); 
        } else {
          Swal.fire({
            title: 'Failed to add players. Ensure the game is in a "waiting_for_players" state.',
            icon: "error"
          });
        }
    } finally {
        await refreshUserProfile(); // Refresh user profile after bet attempt
    }
  }, [gameId, gameStatus, gameSettings.betAmount, gameSettings.houseEdge, gameSettings.winningPattern, selectedTickets, refreshUserProfile]);
  
  // MODIFIED: handleVerifyBet
    // MODIFIED: handleVerifyBet
  const handleVerifyBet = useCallback(async (gameId, ticketNumber) => {
    try {
      const response = await verifyBet(gameId, ticketNumber); 
      const claimResult = response;
      console.log("Claim verification response:", claimResult);

      if (claimResult.isValid) {
        setGameStatus('claims_only'); // <--- CRITICAL: Game state transitions to 'claims_only'
        setIsGamePausedForClaim(true); // Frontend pause flag (redundant, but safe)
        
        Swal.fire({
          title: "BINGO! 🎉",
          html: claimResult.message,
          icon: "success",
          confirmButtonText: "Great!",
        });
        // Auto-calling is now permanently stopped by gameStatus === 'claims_only'
      } else { // If the claim is NOT valid
        // If game was paused (by modal opening) and now no winner, resume normal 'in_progress'
        if (gameStatus === 'in_progress' && isGamePausedForClaim) { 
          setIsGamePausedForClaim(false); // Resume auto-calling
        }
        Swal.fire({
          title: "Claim Not Valid",
          html: claimResult.message,
          icon: "info",
        });
      }
      return claimResult; // Return result for CheckClaimModal to display
    } catch (error) {
      console.error('Error during bet verification:', error);
      // On API error, revert pause state if game was in progress (before the modal closes)
      if (gameStatus === 'in_progress') {
          setIsGamePausedForClaim(false);
      }
      Swal.fire({
        title: "Error Checking Claim",
        html: error.response?.data?.message || 'Failed to check claim due to unexpected error.',
        icon: "error"
      });
      throw error;
    } finally { // This part runs after try/catch block, whether it succeeds or fails
        closeCheckClaimModal(); 
        await refreshUserProfile(); // Refresh user profile after claim attempt (win or not)
    }
  }, [gameStatus, closeCheckClaimModal, isGamePausedForClaim, refreshUserProfile]);

 // MODIFIED: handleRemoveSlip to refresh user profile after cancellation
const handleRemoveSlip = useCallback(async (slipId) => {
    if (!gameId) {
      Swal.fire({
        title: "No active game to remove players from. Please start a new game.",
        icon: "info"
      });
      return;
    }
    try {
        const response = await unassignBingoCard(gameId, slipId);
        setPlayers(response.data.players);
        await refreshUserProfile(); // NEW: Refresh user profile after cancellation
        console.log('Player removed:', slipId);
    } catch (error) {
        console.error('Error removing player:', error.response?.data?.message || error.message);
        if (error.response?.status === 404 && error.response?.data?.message.includes('Game not found in active memory')) {
          Swal.fire({
            title: "The current game session has ended or restarted. Please start a new game.",
            icon: "info"
          });
            setGameStatus('idle');
            setGameId(null);
            setPlayers([]);
            setIsGamePausedForClaim(false); // Ensure pause state is reset if game reset
        } else {
          Swal.fire({
            title: error.response?.data?.message || 'Failed to remove player.',
            icon: "info"
          });
        }
    }
  }, [gameId, refreshUserProfile]);

  const handleEndGame = useCallback(async () => {
    if (!gameId) {
      Swal.fire({
        title: "No game currently in progress to end.",
        icon: "warning"
      });
      return;
    }

      const result = await Swal.fire({
        title: "Are you sure you want to end the current game?",
        text: "This cannot be undone.",
        icon: "warning", // Or 'question' for a more neutral tone
        showCancelButton: true, // This adds the "Cancel" button
        confirmButtonColor: "#d33", // A common color for destructive actions (red)
        cancelButtonColor: "#3085d6", // Default blue for cancel
        confirmButtonText: "Yes, end it!", // Customize confirm button text
        cancelButtonText: "No, cancel" // Customize cancel button text
    });

     if (!result.isConfirmed) {
        return;
    }

    try {
        await finishGame(gameId); // This API call handles deleting the game from backend memory
        setGameStatus('ended'); // Full reset on frontend
        setGameId(null);
        setDrawnNumbers([]);
        setLastCalledNumber(null);
        setPlayers([]);
        setUncalledNumbersCount(0);
        setSelectedTickets([]);
        if (gameTimerRef.current) { // Clear any pending timers
            clearTimeout(gameTimerRef.current);
            gameTimerRef.current = null;
        }
        setIsGamePausedForClaim(false); // Game ended, ensure not paused
        console.log('Game ended successfully.');
        Swal.fire({
          title: "Game has been ended!",
          icon: "success"
        });
    }
    catch (error) {
        console.error('Error ending game:', error.response?.data?.message || error.message);
        if (error.response?.status === 404 && error.response?.data?.message.includes('Game not found')) {
          Swal.fire({
            title: "The game session was lost. Game already ended or server restarted.",
            icon: "error"
          });
            setGameStatus('idle');
            setGameId(null);
            setPlayers([]);
            setDrawnNumbers([]);
            setIsGamePausedForClaim(false); // Ensure not paused if reset
        } else {
           Swal.fire({
            title: "Failed to end game.",
            icon: "error"
          });
        }
    }
  }, [gameId, gameTimerRef]); // Added gameTimerRef to dependencies

  // MODIFIED: Only run timer if game is in 'in_progress' and not manual mode
useEffect(() => {
     let timer;
     // Auto-calling only happens when status is 'in_progress' and not manual mode
     if (gameStatus === 'in_progress' && !manualMode) { // Removed `!isGamePausedForClaim` from condition
       if (uncalledNumbersCount > 0) {
         gameTimerRef.current = setTimeout(callNextNumber, timeInterval * 1000);
       } else if (uncalledNumbersCount === 0 && drawnNumbers.length === 75) {
         // All numbers called but no winner declared yet (or no winner possible), game ends.
         setGameStatus('ended');
         setIsGamePausedForClaim(false); // Ensure not paused if ended
       }
     }
     // Cleanup: clear the timer if component unmounts or dependencies change
     return () => { 
       if (gameTimerRef.current) {
         clearTimeout(gameTimerRef.current);
         gameTimerRef.current = null;
       }
     };
   }, [gameStatus, manualMode, drawnNumbers.length, timeInterval, uncalledNumbersCount, callNextNumber]); // Removed `isGamePausedForClaim` from dependencies

   return (
    <div id="root">
      <div className="Toastify"></div>

      {/* Pass the wrapped handleVerifyBet */}
      <CheckClaimModal isOpen={isCheckClaimModalOpen} onClose={closeCheckClaimModal} gameId={gameId} verifyBet={handleVerifyBet} />
      <CallHistoryModal isOpen={isCallHistoryModalOpen} onClose={closeCallHistoryModal} />
      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirmLogout={handleLogout} />
      <ReportsModal isOpen={isReportsModalOpen} onClose={closeReportsModal} getCashierSummary={getCashierSummary} />

      {isLoggedIn ? (
        userRole === 'admin' ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <div className="h-screen w-full overflow-hidden">
            <div className="root-layout h-screen w-screen overflow-x-hidden">
              <main className="h-full">
                <div className={`h-full w-full overflow-hidden ${selectedTheme === 'red' ? 'bg-gradient-to-br from-dama-red-dark via-dama-red-mid to-dama-red-light' : 'bg-base-100'}`}>
                  <Navbar
                    onOpenReports={openReportsModal}
                    onOpenSettings={openSettingsDrawer}
                    onOpenLogout={openLogoutModal}
                    currentUsername={currentUsername}
                  />
                  <HomePage
                    gameSettings={gameSettings}
                    setGameSettings={handleGameSettingChange}
                    onStartGame={handleStartGame}
                    gameId={gameId}
                    gameStatus={gameStatus} // Pass new gameStatus
                    drawnNumbers={drawnNumbers}
                    lastCalledNumber={lastCalledNumber}
                    onCallNextNumber={callNextNumber}
                    players={players}
                    setPlayers={setPlayers}
                    onAddPlayers={handleAddPlayers}
                    onRemoveSlip={handleRemoveSlip}
                    onEndGame={handleEndGame}
                    selectedTickets={selectedTickets}
                    setSelectedTickets={setSelectedTickets}
                    uncalledNumbersCount={uncalledNumbersCount}
                    onOpenCheckClaimModal={openCheckClaimModal}
                    userProfile={userProfile}
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
        )
      ) : (
        showRegisterPage ? (
          <RegisterPage onRegister={handleRegister} onSwitchToLogin={handleSwitchToLogin} />
        ) : (
          <LoginPage onLogin={handleLogin} />
        )
      )}
    </div>
  );
}

export default App;