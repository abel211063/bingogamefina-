// --- START OF FILE HomePage.jsx ---
import React, { useState, useEffect, useCallback } from 'react';
import GameParametersPanel from '../components/GameParametersPanel';
import AddPlayersPanel from '../components/AddPlayersPanel';
import TicketSelectionPanel from '../components/TicketSelectionPanel';
import RemoveSlipModal from '../components/RemoveSlipModal';
import WinningPatternDisplay from '../components/WinningPatternDisplay';
import LastFiveCalls from '../components/LastFiveCalls';
import AllNumbersGrid from '../components/AllNumbersGrid';
import Swal from 'sweetalert2'

const winningPatterns = {
  'anyTwoLines': { name: 'Any two lines' },
  'fullHouse': { name: 'Full House (Blackout)' },
  'horizontalLine': { name: 'Any Horizontal Line' },
  'verticalLine': { name: 'Any Vertical Line' },
  'diagonalTLBR': { name: 'Diagonal (Top-Left to Bottom-Right)' },
  'diagonalTRBL': { name: 'Diagonal (Top-Right to Bottom-Left)' },
  'fourCorners': { name: 'Four Corners' },
  'xPattern': { name: 'X Pattern' },
  'custom': { name: 'Custom Pattern' },
};

const getVisualPattern = (patternName) => {
    const pattern = Array(5).fill(0).map(() => Array(5).fill(false)); 
    
    switch (patternName) {
        case 'anyTwoLines':
            pattern[0].fill(true);
            pattern.forEach(row => row[0] = true);
            break;
        case 'fullHouse':
            pattern.forEach(row => row.fill(true));
            break;
        case 'horizontalLine':
            pattern[0].fill(true);
            break;
        case 'verticalLine':
            pattern.forEach(row => row[0] = true);
            break;
        case 'diagonalTLBR':
            pattern.forEach((row, i) => row[i] = true);
            break;
        case 'diagonalTRBL':
            pattern.forEach((row, i) => row[4 - i] = true);
            break;
        case 'fourCorners':
            pattern[0][0] = true; 
            pattern[0][4] = true;
            pattern[4][0] = true; 
            pattern[4][4] = true;
            break;
        case 'xPattern':
            pattern.forEach((row, i) => {
                row[i] = true;
                row[4 - i] = true;
            });
            break;
        case 'custom':
            break;
        default:
            break;
    }
    return pattern;
};


function HomePage({
  gameSettings, setGameSettings, onStartGame, gameId, gameStatus,
  drawnNumbers, lastCalledNumber, onCallNextNumber,
  players, setPlayers, onAddPlayers, onRemoveSlip, onEndGame,
  selectedTickets, setSelectedTickets, uncalledNumbersCount,
  onOpenCheckClaimModal,userProfile
}) {
  const [activePanel, setActivePanel] = useState('gameParameters');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRemoveSlipModalOpen, setIsRemoveSlipModal] = useState(false);
  const [slipToRemove, setSlipToRemove] = useState(null);

  const [allAvailableTickets, setAllAvailableTickets] = useState([]);


  


  const [customPatternDefinition, setCustomPatternDefinition] = useState(
    Array(5).fill(0).map(() => Array(5).fill(false))
  );

  useEffect(() => {
    const ticketNumbers = Array.from({ length: 150 }, (_, i) => i + 1);
    setAllAvailableTickets(ticketNumbers);
  }, []);

  const handleTicketSelection = useCallback((ticketNumber) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticketNumber)) {
        return prev.filter((t) => t !== ticketNumber);
      } else {
        return [...prev, ticketNumber];
      }
    });
  }, [setSelectedTickets]);

  const handleActivateTickets = useCallback(() => {
    if (selectedTickets.length === 0) {
      Swal.fire({
        title: "Please select tickets to activate.",
        icon: "info"
      });
        return;
    }
    // MODIFIED: Pass customPatternDefinition to onAddPlayers
    onAddPlayers(selectedTickets, customPatternDefinition); 
  }, [selectedTickets, onAddPlayers, customPatternDefinition]);

  const handleSearchChange = (event) => setSearchText(event.target.value);
  const handleOpenRemoveSlipModal = useCallback((slipId) => {
    setSlipToRemove(slipId);
    setIsRemoveSlipModal(true);
  }, []);
  const handleCloseRemoveSlipModal = useCallback(() => {
    setSlipToRemove(null);
    setIsRemoveSlipModal(false);
  }, []);
  const handleConfirmRemoveSlip = useCallback(() => {
    onRemoveSlip(slipToRemove);
    handleCloseRemoveSlipModal();
  }, [slipToRemove, onRemoveSlip, handleCloseRemoveSlipModal]);

  const isStartGameDisabled =
    (gameStatus === 'idle' && players.length === 0) ||
    gameStatus === 'in_progress' ||
    gameStatus === 'starting' ||
    gameStatus === 'claims_only'; // Disable start if in claims_only mode




    // NEW: Calculate activation button disabled state and warning message
  const totalCostForSelectedTickets = selectedTickets.length * gameSettings.betAmount;
  const isActivateTicketsDisabled =
      !userProfile || // No user profile means not logged in as retail
      !userProfile.isActive || // User is inactive
      userProfile.balance < totalCostForSelectedTickets || // Insufficient balance
      gameStatus === 'in_progress' || gameStatus === 'claims_only'; // Game is already ongoing or has winner

  let activationWarningMessage = '';
  if (!userProfile) {
    activationWarningMessage = 'Please log in as a retail user to activate tickets.';
  } else if (!userProfile.isActive) {
    activationWarningMessage = 'Your account is inactive. Please recharge your account.';
  } else if (userProfile.balance < totalCostForSelectedTickets) {
    activationWarningMessage = `Insufficient balance. Required: ${totalCostForSelectedTickets.toFixed(2)} ETB. Your balance: ${userProfile.balance.toFixed(2)} ETB.`;
  } else if (gameStatus === 'in_progress' || gameStatus === 'claims_only') {
    activationWarningMessage = 'Game is in progress or has a winner. Cannot activate new tickets.';
  }



  const currentVisualPattern = getVisualPattern(gameSettings.winningPattern);


  return (
    <div className="flex flex-col justify-between px-5 md:flex-row">
      <div className="flex h-[93vh] w-full flex-col items-center overflow-y-auto p-4 md:w-1/3 lg:w-1/3">
        <div className="flex w-full flex-col items-start">
          <h1 className="mb-3 text-lg font-bold uppercase text-white">
            {/* Show 'Bingo Game' when in progress or claims_only mode */}
            {(gameStatus === 'in_progress' || gameStatus === 'claims_only') 
             ? 'Bingo Game' 
             : activePanel === 'gameParameters' ? 'Game Parameters' : 'Add Players'}
            {gameId && <span className="ml-4 text-sm font-normal">Game ID: {gameId} - Status: {
                (gameStatus === 'in_progress' || gameStatus === 'claims_only') 
                ? (gameStatus === 'claims_only' ? 'Winner Found - Check Claims' : 'In Progress') 
                : gameStatus
            }</span>}
          </h1>

          {/* Tabs should only show if the game is NOT in progress and NOT in claims_only mode */}
          {(gameStatus !== 'in_progress' && gameStatus !== 'claims_only') && (
            <div className="flex h-11 w-full">
              <div
                className={`flex h-full w-1/2 cursor-pointer items-center justify-center rounded-l-lg border border-white font-semibold ${
                  activePanel === 'gameParameters' ? 'bg-white text-dama-text-dark' : 'bg-transparent text-white'
                }`}
                onClick={() => setActivePanel('gameParameters')}
              >
                <p>Game Parameters </p>
              </div>
              <div
                className={`flex h-full w-1/2 cursor-pointer items-center justify-center rounded-r-lg font-semibold ${
                  activePanel === 'addPlayers' ? 'bg-white text-dama-text-dark' : 'bg-transparent text-white'
                }`}
                onClick={() => setActivePanel('addPlayers')}
              >
                <p>Add Players</p>
              </div>
            </div>
          )}

          <div className="my-5 h-[79vh] w-full">
            {/* Show WinningPatternDisplay if game is in progress or claims_only */}
            {(gameStatus === 'in_progress' || gameStatus === 'claims_only') ? (
              <WinningPatternDisplay
                lastCalledNumber={lastCalledNumber}
                winningPatternName={gameSettings.winningPattern}
                customPatternGrid={gameSettings.winningPattern === 'custom' ? customPatternDefinition : null}
              />
            ) : activePanel === 'gameParameters' ? (
              <GameParametersPanel
                betAmount={gameSettings.betAmount}
                setBetAmount={(value) => setGameSettings('betAmount', value)}
                houseEdge={gameSettings.houseEdge}
                setHouseEdge={(value) => setGameSettings('houseEdge', value)}
                winningPattern={gameSettings.winningPattern}
                setWinningPattern={(e) => setGameSettings('winningPattern', e.target.value)}
                onStartGame={onStartGame}
                isStartGameDisabled={isStartGameDisabled}
                winningPatterns={winningPatterns}
                currentVisualPattern={currentVisualPattern}
                customPatternDefinition={customPatternDefinition}
                setCustomPatternDefinition={setCustomPatternDefinition}
              />
            ) : (
              <AddPlayersPanel
                players={players}
                searchText={searchText}
                handleSearchChange={handleSearchChange}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onOpenRemoveSlipModal={handleOpenRemoveSlipModal}
              />
            )}
          </div>
        </div>
      </div>

      <div className="my-3 h-auto w-[1px] bg-white"></div>

      <div className="flex h-[93vh] w-full flex-col p-4 md:w-2/3 lg:w-2/3">
        {/* Show game controls if game is in progress or claims_only */}
        {(gameStatus === 'in_progress' || gameStatus === 'claims_only') ? (
          <div className="flex flex-col h-full w-full">
            <h2 className="text-white text-xl font-bold mb-4 text-center">Game Controls</h2>
            <button
              className="btn btn-lg btn-success w-full mb-4"
              onClick={onCallNextNumber}
              // Disable Call Next if game is ended OR in claims_only mode
              disabled={uncalledNumbersCount === 0 || gameStatus === 'ended' || gameStatus === 'claims_only'} 
            >
              Call Next Number ({drawnNumbers.length}/75)
            </button>
            <button
              className="btn btn-lg btn-warning w-full mb-4"
              onClick={onOpenCheckClaimModal} 
            >
              Check Claim
            </button>
            
            <div className="mt-2 w-full p-1 rounded-lg bg-[#FFFFFF1A] mb-4
                          max-h-[60vh] overflow-y-auto">
                <AllNumbersGrid drawnNumbers={drawnNumbers} lastCalledNumber={lastCalledNumber} />
            </div>

            <button className="btn btn-lg btn-error w-full mb-2" onClick={onEndGame}>
              End Game
            </button>
            
            <LastFiveCalls drawnNumbers={drawnNumbers} lastCalledNumber={lastCalledNumber} />
          </div>
        ) : (
          // Otherwise, show Ticket Selection Panel
          <TicketSelectionPanel
            tickets={allAvailableTickets}
            selectedTickets={selectedTickets}
            onSelectTicket={handleTicketSelection}
            onActivateTickets={handleActivateTickets}
            betAmount={gameSettings.betAmount} 
            isActivateTicketsDisabled={isActivateTicketsDisabled}
            activationWarningMessage={activationWarningMessage}
            userCurrentBalance={userProfile?.balance}
          />
        )}
      </div>

      <RemoveSlipModal
        isOpen={isRemoveSlipModalOpen}
        onClose={handleCloseRemoveSlipModal}
        onConfirm={handleConfirmRemoveSlip}
        slipId={slipToRemove}
      />
    </div>
  );
}

export default HomePage;