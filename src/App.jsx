// --- START OF FILE App.jsx ---
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import SpecialEditModal from './components/SpecialEditModal';

import Swal from 'sweetalert2'

import Confetti from 'react-confetti';

import { getCommissionTiers } from './api/apiService';


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
    winningPattern: 'anyLine', // MODIFIED: Set to match screenshot's visual pattern
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
  const [selectedTheme, setSelectedTheme] = useState('red'); // Keep 'red' as the theme for the gradient
  const [selectedDisplayLanguage, setSelectedDisplayLanguage] = useState('English');
  const [selectedAudioLanguage, setSelectedAudioLanguage] = useState('Amharic Male');

  const [isCheckClaimModalOpen, setIsCheckClaimModalOpen] = useState(false);
  const [isCallHistoryModalOpen, setIsCallHistoryModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  // This state is now mostly managed by gameStatus, but kept for clarity during transitions
  const [isGamePausedForClaim, setIsGamePausedForClaim] = useState(false);

  const [showAppConfetti, setShowAppConfetti] = useState(false);

   const [isPaused, setIsPaused] = useState(true); // Game is paused by default until 'Start' is hit
   const [isCallingNumber, setIsCallingNumber] = useState(false); // Prevents concurrent calls
   const isCallingRef = useRef(false);
   const prevGameState = useRef({ isPaused, isGamePausedForClaim });
   const [audioLoadingProgress, setAudioLoadingProgress] = useState(0);
   const audioCacheRef = useRef(new Map());

   const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false); // 2. ADD THIS STATE
   const [commissionTiers, setCommissionTiers] = useState([]); // <-- ADD THIS LINE


  const openCommissionModal = useCallback(() => setIsCommissionModalOpen(true), []);
  const closeCommissionModal = useCallback(() => setIsCommissionModalOpen(false), []);


  useEffect(() => {
    const fetchTiers = async () => {
      if (isLoggedIn && userRole === 'retail') {
        try {
          const response = await getCommissionTiers();
          setCommissionTiers(response.data);
        } catch (error) {
          console.error("Failed to load commission tiers for UI:", error);
        }
      }
    };
    fetchTiers();
  }, [isLoggedIn, userRole]);

const winnerPrize = useMemo(() => {
    const betAmount = gameSettings.betAmount || 0;
    const playerCount = players.length;
    let houseEdge = 0; // Default to 0

    if (playerCount > 5 && commissionTiers.length > 0) {
      // Only check tiers if more than 5 players
      const applicableTier = commissionTiers.find(tier => 
        playerCount >= tier.min && playerCount <= tier.max
      );
      if (applicableTier) {
        houseEdge = applicableTier.percentage;
      }
    }
    
    if (playerCount > 0) {
        const totalPot = playerCount * betAmount;
        const prize = totalPot - (totalPot * (houseEdge / 100));
        return prize > 0 ? prize.toFixed(2) : '0.00';
    }
    
    // For 0 players, show potential prize for 1 player (with 0% cut)
    return betAmount > 0 ? betAmount.toFixed(2) : '0.00';

  }, [players.length, gameSettings.betAmount, commissionTiers]);

    const handleTiersUpdated = useCallback(async () => {
    try {
      const response = await getCommissionTiers();
      setCommissionTiers(response.data);
    } catch (error) {
      console.error("Failed to re-fetch commission tiers:", error);
    }
  }, []);

   // NEW: Function to play sound from the preloaded cache
  const playBingoSound = useCallback((number, language) => {
    const basePath = audioLanguageMap[language];
    if (!basePath) {
      console.warn(`No audio path for language: ${language}`);
      return;
    }
    const filename = getBingoAudioFilename(number);
    const audioPath = `${basePath}${filename}`;

    const cachedAudio = audioCacheRef.current.get(audioPath);
    if (cachedAudio) {
      cachedAudio.currentTime = 0; // Rewind to start in case it's played again quickly
      cachedAudio.play().catch(e => console.error(`Error playing cached audio ${audioPath}:`, e));
    } else {
      // Fallback for when preloading hasn't finished or failed for a file
      console.warn(`Audio not found in cache, playing on-demand: ${audioPath}`);
      const audio = new Audio(audioPath);
      audio.play().catch(e => console.error(`Error playing on-demand audio ${audioPath}:`, e));
    }
  }, []); // Empty dependency array as it uses refs and constants

  // NEW: useEffect for preloading audio files
  useEffect(() => {
    const preloadAudio = async () => {
      const language = 'Amharic Male'; // Default language to preload
      const basePath = audioLanguageMap[language];
      if (!basePath) return;

      const totalSounds = 75;
      let loadedCount = 0;

      for (let i = 1; i <= totalSounds; i++) {
        const filename = getBingoAudioFilename(i);
        const path = `${basePath}${filename}`;
        
        const audio = new Audio(path);
        // This event fires when the browser has enough data to play the audio without stopping
        audio.oncanplaythrough = () => {
          loadedCount++;
          setAudioLoadingProgress(Math.round((loadedCount / totalSounds) * 100));
          audioCacheRef.current.set(path, audio); // Add the ready audio object to our cache
        };
        audio.onerror = () => { console.error(`Failed to preload: ${path}`); };
      }
    };

    preloadAudio();
  }, []); // Run only once on initial component mount

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


// In App.jsx, REPLACE your callNextNumber function with this one
const callNextNumber = useCallback(async () => {
    // This ref check is instant and prevents race conditions
    if (isCallingRef.current) return;

    if (!gameId || gameStatus !== 'in_progress' || isPaused || isGamePausedForClaim) {
        return;
    }

    try {
        isCallingRef.current = true; // Instantly block other calls
        setIsCallingNumber(true); // Update state for UI changes

        const response = await apiCallNextNumber(gameId);
        const { lastCalledNumber, drawnNumbers, gameStatus: newGameStatus, uncalledNumbersCount } = response.data;
        
        setLastCalledNumber(lastCalledNumber);
        setDrawnNumbers(drawnNumbers);
        setUncalledNumbersCount(uncalledNumbersCount);
        setGameStatus(newGameStatus);

        if (audibleCaller && lastCalledNumber) {
            playBingoSound(lastCalledNumber.number, selectedAudioLanguage);
        }
    } catch (error) {
        console.error('Error calling next number:', error.response?.data?.message || error.message);
        // ... (rest of your error handling)
    } finally {
        isCallingRef.current = false; // Instantly unblock
        setIsCallingNumber(false); // Update state for UI
    }
}, [gameId, gameStatus, isPaused, isGamePausedForClaim, audibleCaller, selectedAudioLanguage, playBingoSound]);

    // --- REPLACE THIS FUNCTION in App.jsx ---
  // In App.jsx
const closeCheckClaimModal = useCallback(() => {
   setIsCheckClaimModalOpen(false);
   if (gameStatus === 'in_progress' && isGamePausedForClaim) { 
     setIsGamePausedForClaim(false);
     // REMOVE THE LINE BELOW
     // setTimeout(() => callNextNumber(), 0);
   }
 }, [gameStatus, isGamePausedForClaim]); // REMOVED callNextNumber dependency

// In App.jsx
const handleStartGame = useCallback(async () => {
    // ... (keep all the checks) ...
    if (gameStatus === 'waiting_for_players') {
        setGameStatus('in_progress');
        setIsPaused(false);
        // REMOVE THE LINE BELOW
        // setTimeout(() => callNextNumber(), 0); 
        console.log(`Game ${gameId} client-side status set to 'in_progress'.`);
    } else {
        console.log(`Game is already in status: ${gameStatus}. Cannot start.`);
    }
}, [gameId, gameStatus]); // REMOVED callNextNumber dependency



// In App.jsx
const handleTogglePause = useCallback(() => {
   if (gameStatus === 'in_progress') {
     const willBePaused = !isPaused;
     setIsPaused(willBePaused);

     // REMOVE THE ENTIRE 'if' BLOCK BELOW
     /*
     if (!willBePaused) {
       setTimeout(() => callNextNumber(), 0); 
     }
     */
   }
 }, [gameStatus, isPaused]); // REMOVED callNextNumber dependency


   // handleAddPlayers logic: Responsible for ensuring a game exists and adding players to it.
// From App.jsx

  // handleAddPlayers logic: Responsible for ensuring a game exists and adding players to it.
// --- REPLACE your old handleAddPlayers function with this new one ---

const handleAddPlayers = useCallback(async (selectedTicketsForActivation, customPatternDefinition) => {
    if (selectedTicketsForActivation.length === 0) {
      Swal.fire({ title: "Please select tickets to activate.", icon: "warning" });
      return;
    }
    if (gameStatus === 'in_progress' || gameStatus === 'claims_only') {
      Swal.fire({ title: "Cannot activate tickets while a game is in progress.", icon: "info" });
      return;
    }

    // This shows an "Activating..." popup IMMEDIATELY
    Swal.fire({
      title: 'Activating Tickets...',
      text: 'Please wait while we set up the game.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      let gameToActOnId = gameId;

      if (!gameToActOnId || gameStatus === 'idle' || gameStatus === 'ended') {
        const gameSettingsToSend = {
          betAmount: gameSettings.betAmount,
          houseEdge: gameSettings.houseEdge,
          winningPattern: gameSettings.winningPattern,
          ...(gameSettings.winningPattern === 'custom' && { customPatternDefinition })
        };
        const startGameResponse = await generateBingoGame(gameSettingsToSend);
        gameToActOnId = startGameResponse.data.gameId;
        setGameId(gameToActOnId);
        setGameStatus(startGameResponse.data.gameState.status);
        setUncalledNumbersCount(75);
        setPlayers([]);
        setDrawnNumbers([]);
        setLastCalledNumber(null);
        setIsPaused(true);
      }

      const response = await activateTickets(gameToActOnId, selectedTicketsForActivation);
      setPlayers(response.data.players);
      setSelectedTickets([]);
      
      // This updates the popup to show the "Success" message
      Swal.fire({
        title: 'Success!',
        text: `Successfully activated ${selectedTicketsForActivation.length} tickets.`,
        icon: 'success',
        timer: 2000 // Automatically close after 2 seconds
      });

    } catch (error) {
      console.error('Error adding players:', error.response?.data?.message || error.message);
      let errorMessage = 'Failed to add players. Please try again.';
      if (error.response?.status === 404) {
        errorMessage = "The game session was lost. Please try activating tickets again.";
        setGameStatus('idle');
        setGameId(null);
        setPlayers([]);
        setDrawnNumbers([]);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // This updates the popup to show the "Error" message
      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error'
      });
    } finally {
      // This runs in the background after the user gets their message
      await refreshUserProfile();
    }
}, [gameId, gameStatus, gameSettings, refreshUserProfile]);



const handleVerifyBet = useCallback(async (gameId, ticketNumber) => {
  try {
    const claimResult = await verifyBet(gameId, ticketNumber);
    console.log("Claim verification response:", claimResult);

    if (claimResult.isValid) {
      setGameStatus('claims_only');
      setIsGamePausedForClaim(true);
      
      // --- THE NEW CONFETTI LOGIC ---
      // 1. Turn the confetti ON
      setShowAppConfetti(true);
      
      // 2. Set a timer to turn it OFF after 7 seconds (7000 milliseconds)
      setTimeout(() => {
        setShowAppConfetti(false);
      }, 7000); 
      // --- END OF NEW LOGIC ---

      const winSound = new Audio('/audio/win-cheer.mp3');
      winSound.play().catch(e => console.error("Error playing win sound:", e));
      
    } else {
      if (claimResult.message && !claimResult.message.includes('not in this game')) {
        const notWinSound = new Audio('/audio/not-win.mp3');
        notWinSound.play().catch(e => console.error("Error playing not-win sound:", e));
      }
    }
    
    return claimResult;

  } catch (error) {
    console.error('Error during bet verification:', error);
    if (gameStatus === 'in_progress') {
      setIsGamePausedForClaim(false);
    }
    throw error; 
  } finally {
    await refreshUserProfile();
  }
}, [gameStatus, refreshUserProfile]);

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
        setGameStatus('idle'); // Full reset on frontend
        setGameId(null);
        setDrawnNumbers([]);
        setLastCalledNumber(null);
        setPlayers([]);
        setUncalledNumbersCount(0);
        setSelectedTickets([]);
        setShowAppConfetti(false);
        if (gameTimerRef.current) { // Clear any pending timers
            clearTimeout(gameTimerRef.current);
            gameTimerRef.current = null;
        }
        setIsGamePausedForClaim(false); // Game ended, ensure not paused
        console.log('Game ended successfully.');
        Swal.fire({
          title: "Game has been ended!",
          icon: "success",
          timer:1000
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













  // In App.jsx
// --- REPLACE your main game timer useEffect with this final version ---
useEffect(() => {
    // This function runs at the end of the effect to update our ref for the *next* render.
    const updatePreviousState = () => {
        prevGameState.current = { isPaused, isGamePausedForClaim };
    };

    // Condition to STOP: If the game shouldn't be auto-calling, clear any timer and exit.
    if (gameStatus !== 'in_progress' || manualMode || isGamePausedForClaim || isPaused) {
        if (gameTimerRef.current) {
            clearTimeout(gameTimerRef.current);
            gameTimerRef.current = null;
        }
        updatePreviousState(); // Still update the state ref before exiting
        return;
    }

    // --- SMART DELAY LOGIC ---
    const wasPaused = prevGameState.current.isPaused;
    const wasPausedForClaim = prevGameState.current.isGamePausedForClaim;

    // A "resume" event is when the game was paused before, but isn't now.
    const justResumed = (wasPaused && !isPaused) || (wasPausedForClaim && !isGamePausedForClaim);

    const isFirstCall = drawnNumbers.length === 0;
    let delay = timeInterval * 1000; // Default delay is the user-set interval

    if (isFirstCall) {
        delay = 1000; // 1-second delay for the very first number.
    } else if (justResumed) {
        delay = 10; // Nearly instant (10ms) call when resuming from pause or claim.
    }

    gameTimerRef.current = setTimeout(callNextNumber, delay);

    // Update the ref for the next time this effect runs.
    updatePreviousState();

    // The cleanup function is crucial to prevent multiple timers running.
    return () => {
        if (gameTimerRef.current) {
            clearTimeout(gameTimerRef.current);
            gameTimerRef.current = null;
        }
    };
}, [
    drawnNumbers.length, 
    gameStatus, 
    isPaused, 
    isGamePausedForClaim, 
    manualMode, 
    timeInterval, 
    callNextNumber
]);



   return (
    <div id="root">
       {showAppConfetti && (
         <Confetti
           style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1051 }}
           recycle={false}
           numberOfPieces={500}
           onConfettiComplete={() => setShowAppConfetti(false)}
         />
       )}
       {audioLoadingProgress > 0 && audioLoadingProgress < 100 && (
         <div className="fixed bottom-2 right-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-50">
           Loading sounds... {audioLoadingProgress}%
         </div>
       )}

      <div className="Toastify"></div>

     <CheckClaimModal 
     isOpen={isCheckClaimModalOpen} 
    onClose={closeCheckClaimModal} 
    gameId={gameId} 
    verifyBet={handleVerifyBet}
    drawnNumbers={drawnNumbers}
    winningPatternName={gameSettings.winningPattern}
    customPatternGrid={gameSettings.winningPattern === 'custom' ? gameSettings.customPatternDefinition : null} 
     />
      <CallHistoryModal isOpen={isCallHistoryModalOpen} onClose={closeCallHistoryModal} />
      <LogoutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirmLogout={handleLogout} />
      <ReportsModal isOpen={isReportsModalOpen} onClose={closeReportsModal} getCashierSummary={getCashierSummary} />
      <SpecialEditModal isOpen={isCommissionModalOpen} 
      onClose={closeCommissionModal}
      onTiersUpdated={handleTiersUpdated} />

      {isLoggedIn ? (
        userRole === 'admin' ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : (
          <div className="h-screen w-full overflow-hidden">
            <div className="root-layout h-screen w-screen overflow-x-hidden">
              <main className="h-full">
                {/* MODIFIED: Use the red gradient background for the game */}
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
                    gameStatus={gameStatus}
                    drawnNumbers={drawnNumbers}
                    lastCalledNumber={lastCalledNumber}
                    onCallNextNumber={callNextNumber}
                    players={players}
                    setPlayers={setPlayers}
                    onAddPlayers={handleAddPlayers}
                    onRemoveSlip={handleRemoveSlip}
                    onEndGame={handleEndGame}
                    isPaused={isPaused}
                    isGamePausedForClaim={isGamePausedForClaim}
                    onTogglePause={handleTogglePause}
                    selectedTickets={selectedTickets}
                    setSelectedTickets={setSelectedTickets}
                    uncalledNumbersCount={uncalledNumbersCount}
                    onOpenCheckClaimModal={openCheckClaimModal}
                    userProfile={userProfile}
                    winnerPrize={winnerPrize}
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
                  onOpenCommissionModal={openCommissionModal}
                />
              </main>
            </div>
          </div>
        )
      ) : (
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
