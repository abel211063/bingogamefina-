// --- START OF FILE HomePage.jsx ---
import React, { useState, useEffect, useCallback } from 'react';
import GameParametersPanel from '../components/GameParametersPanel';
import AddPlayersPanel from '../components/AddPlayersPanel';
import TicketSelectionPanel from '../components/TicketSelectionPanel';
import RemoveSlipModal from '../components/RemoveSlipModal';
import WinningPatternDisplay from '../components/WinningPatternDisplay';
import AllNumbersGrid from '../components/AllNumbersGrid';
import LastFiveCalls from '../components/LastFiveCalls'; // MODIFIED: Re-imported LastFiveCalls
import Swal from 'sweetalert2'
import ShuffleAnimationModal from '../components/ShuffleAnimationModal'; 

const winningPatterns = {
  'anyLine': { name: 'Any Line (Horizontal, Vertical, or Diagonal)' },
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
            pattern.forEach(row => row[2] = true); // Center vertical for visual
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
        case 'anyLine':
            // A representative visual combining multiple line types
            pattern[2].fill(true); // Middle horizontal
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
  isPaused, onTogglePause,
  selectedTickets, setSelectedTickets,
  onOpenCheckClaimModal, userProfile,
 winnerPrize
}) {
  const [activePanel, setActivePanel] = useState('gameParameters');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRemoveSlipModalOpen, setIsRemoveSlipModal] = useState(false);
  const [slipToRemove, setSlipToRemove] = useState(null);

  const [allAvailableTickets, setAllAvailableTickets] = useState([]);

  const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false); // Add this line


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
    gameStatus === 'claims_only';

  const totalCostForSelectedTickets = selectedTickets.length * gameSettings.betAmount;
  const isActivateTicketsDisabled =
      !userProfile || 
      !userProfile.isActive || 
      userProfile.balance < totalCostForSelectedTickets || 
      gameStatus === 'in_progress' || gameStatus === 'claims_only';

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

  const isSetupPhase = gameStatus === 'idle' || gameStatus === 'waiting_for_players';
  const currentVisualPattern = getVisualPattern(gameSettings.winningPattern);


  return (
    <div className="flex flex-col justify-between px-5 md:flex-row h-[93vh]">
      {isSetupPhase ? (
        <>
            <div className="flex h-full w-full flex-col items-center overflow-y-auto p-4 md:w-1/3 lg:w-1/3">
                <div className="flex w-full flex-col items-start">
                    <h1 className="mb-3 text-lg font-bold uppercase text-white">
                        {activePanel === 'gameParameters' ? 'Game Parameters' : 'Add Players'}
                        {gameId && <span className="ml-4 text-sm font-normal">Game ID: {gameId}</span>}
                    </h1>

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

                    <div className="my-5 h-[79vh] w-full">
                        {activePanel === 'gameParameters' ? (
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

            <div className="flex h-full w-full flex-col p-4 md:w-2/3 lg:w-2/3">
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
            </div>
        </>
      ) : (
        // --- NEW MERGED IN-GAME VIEW ---
        <div className="flex flex-col md:flex-row h-full w-full gap-4 p-4 text-white">
            {/* Left Column (from red UI) */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <p className="font-bold text-lg">STATUS: {gameStatus.replace('_', ' ').toUpperCase()}</p>
                <div className="flex-grow bg-[#FFFFFF1A] rounded-lg p-4">
                    <WinningPatternDisplay
                        lastCalledNumber={lastCalledNumber}
                        winningPatternName={gameSettings.winningPattern}
                        customPatternGrid={gameSettings.winningPattern === 'custom' ? customPatternDefinition : null}
                    />
                </div>
                <div className="bg-gray-800 p-2 rounded-lg text-center border-2 border-orange-500">
                    <p className="text-md font-semibold text-gray-400">BET:-</p>
                    <p className="text-2xl font-bold">{gameSettings.betAmount.toFixed(2)}</p>
                </div>
            </div>

            {/* Right Column (merged UI) */}
            <div className="w-full md:w-2/3 flex flex-col gap-2">
                {/* Full Number Grid (from blue UI) */}
                <div className="flex-grow bg-[#FFFFFF1A] rounded-lg p-2 overflow-y-auto">
                    <AllNumbersGrid drawnNumbers={drawnNumbers} lastCalledNumber={lastCalledNumber} />
                </div>
                
                {/* MODIFIED: Added LastFiveCalls back */}
                <LastFiveCalls drawnNumbers={drawnNumbers} lastCalledNumber={lastCalledNumber} />

                {/* Bottom Bar with Prize and Controls (from blue UI) */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-black bg-opacity-30 rounded-lg">
                    <div className="flex-1 text-center sm:text-left">
                        <p className="text-xl font-semibold text-gray-400">WINNER PRIZE</p>
                        <p className="text-5xl font-bold text-green-400">{winnerPrize} <span className="text-2xl">Birr</span></p>
                    </div>
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button className="btn btn-sm btn-info" onClick={() => setIsShuffleModalOpen(true)} disabled={gameStatus === 'in_progress' && !isPaused}>SHUFFLE</button>
                        <button className="btn btn-sm btn-warning" onClick={onTogglePause} disabled={gameStatus === 'ended' || gameStatus === 'claims_only'}>
                            {isPaused ? 'PLAY' : 'PAUSE'}
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={onOpenCheckClaimModal} disabled={gameStatus !== 'in_progress' && gameStatus !== 'claims_only'}>CHECK</button>
                        <button className="btn btn-sm btn-error" onClick={onEndGame}>RESET</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <RemoveSlipModal
        isOpen={isRemoveSlipModalOpen}
        onClose={handleCloseRemoveSlipModal}
        onConfirm={handleConfirmRemoveSlip}
        slipId={slipToRemove}
      />
      <ShuffleAnimationModal isOpen={isShuffleModalOpen} onClose={() => setIsShuffleModalOpen(false)} />
    </div>
  );
}

export default HomePage;



