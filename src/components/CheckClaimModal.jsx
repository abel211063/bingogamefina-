// --- START OF FILE src/components/CheckClaimModal.jsx ---
import React, { useState, useRef, useEffect } from 'react';
import { FIXED_BINGO_CARDS } from '../utils/bingoCards'; // Assumes you have this local data file

// ========================================================================
// --- OPTIMIZED CLIENT-SIDE WIN VERIFICATION LOGIC (NO LOGGING) ---
// ========================================================================

const parseBingoCardString = (cardString) => {
    if (!cardString) return null;
    const matrix = Array(5).fill(null).map(() => Array(5).fill(null));
    const parts = cardString.split('-');
    const colLetters = ['B', 'I', 'N', 'G', 'O'];
    let col = -1, row = 0;
    for (const part of parts) {
        const firstChar = part.charAt(0);
        if (colLetters.includes(firstChar) && isNaN(part)) {
            col++; row = 0;
            matrix[row][col] = parseInt(part.substring(1), 10);
        } else {
            row++;
            if (row < 5 && col !== -1) matrix[row][col] = parseInt(part, 10);
        }
    }
    matrix[2][2] = 'FREE';
    return matrix;
};

const createMarkedGrid = (playerCardMatrix, drawnNumbers) => {
    const markedGrid = Array(5).fill(0).map(() => Array(5).fill(false));
    const drawnSet = new Set(drawnNumbers);
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (r === 2 && c === 2) {
                markedGrid[r][c] = true;
            } else if (playerCardMatrix[r][c] !== null && drawnSet.has(playerCardMatrix[r][c])) {
                markedGrid[r][c] = true;
            }
        }
    }
    return markedGrid;
};

const checkPattern = (markedGrid, patternName, customPatternGrid = null) => {
    const isLineMarked = (line) => line.every(cell => cell);
    const checkHorizontal = () => {
        const lines = [];
        for (let r = 0; r < 5; r++) { if (isLineMarked(markedGrid[r])) lines.push(`row_${r}`); }
        return lines;
    };
    const checkVertical = () => {
        const lines = [];
        for (let c = 0; c < 5; c++) { if (isLineMarked(markedGrid.map(row => row[c]))) lines.push(`col_${c}`); }
        return lines;
    };
    const checkDiagonals = () => {
        const lines = [];
        if (isLineMarked(markedGrid.map((row, i) => row[i]))) lines.push('diag_tlbr');
        if (isLineMarked(markedGrid.map((row, i) => row[4 - i]))) lines.push('diag_trbl');
        return lines;
    };
    
    let winningLines = [];
    switch (patternName) {
        case 'anyLine': winningLines = [...checkHorizontal(), ...checkVertical(), ...checkDiagonals()]; break;
        case 'anyTwoLines': const allFoundLines = [...checkHorizontal(), ...checkVertical(), ...checkDiagonals()]; if (allFoundLines.length >= 2) winningLines = allFoundLines; break;
        case 'fullHouse': if (checkHorizontal().length === 5) winningLines = ['full_house']; break;
        case 'horizontalLine': winningLines = checkHorizontal(); break;
        case 'verticalLine': winningLines = checkVertical(); break;
        case 'diagonalTLBR': if (isLineMarked(markedGrid.map((row, i) => row[i]))) winningLines.push('diag_tlbr'); break;
        case 'diagonalTRBL': if (isLineMarked(markedGrid.map((row, i) => row[4-i]))) winningLines.push('diag_trbl'); break;
        case 'xPattern': const diagonals = checkDiagonals(); if (diagonals.length === 2) winningLines = ['xPattern']; break;
        case 'fourCorners': if (markedGrid[0][0] && markedGrid[0][4] && markedGrid[4][0] && markedGrid[4][4]) winningLines = ['four_corners']; break;
        case 'custom':
            if (!customPatternGrid) return false;
            let isCustomWin = true;
            for (let r = 0; r < 5; r++) { for (let c = 0; c < 5; c++) { if (customPatternGrid[r][c] && !markedGrid[r][c]) { isCustomWin = false; break; } } if (!isCustomWin) break; }
            if (isCustomWin) winningLines = ['custom_win'];
            break;
        default: winningLines = [...checkHorizontal(), ...checkVertical(), ...checkDiagonals()]; break;
    }
    return winningLines.length > 0 ? winningLines : false;
};

const verifyWinOnClient = (cardString, drawnNumbers, winningPattern) => {
    if (!cardString) return { isValid: false, message: "Invalid card data." };
    const playerCardMatrix = parseBingoCardString(cardString);
    const markedGrid = createMarkedGrid(playerCardMatrix, drawnNumbers);
    const winningResult = checkPattern(markedGrid, winningPattern.name, winningPattern.customGrid);
    if (winningResult) {
        return { isValid: true, message: "BINGO!", winningLines: winningResult };
    }
    return { isValid: false, message: "Not a winner yet.", winningLines: [] };
};

// ========================================================================
// --- SVG COMPONENT (Wrapped in React.memo for performance) ---
// ========================================================================
const WinningLineOverlay = React.memo(({ winningLines = [] }) => {
    if (!winningLines || winningLines.length === 0) return null;
    const viewBoxSize = 100, cellCount = 5, cellSize = viewBoxSize / cellCount, halfCell = cellSize / 2;
    const getLineCoords = (line) => {
      const pos = (i) => i * cellSize + halfCell;
      switch(line) {
        case 'row_0': return { x1: halfCell, y1: pos(0), x2: viewBoxSize - halfCell, y2: pos(0) };
        case 'row_1': return { x1: halfCell, y1: pos(1), x2: viewBoxSize - halfCell, y2: pos(1) };
        case 'row_2': return { x1: halfCell, y1: pos(2), x2: viewBoxSize - halfCell, y2: pos(2) };
        case 'row_3': return { x1: halfCell, y1: pos(3), x2: viewBoxSize - halfCell, y2: pos(3) };
        case 'row_4': return { x1: halfCell, y1: pos(4), x2: viewBoxSize - halfCell, y2: pos(4) };
        case 'col_0': return { x1: pos(0), y1: halfCell, x2: pos(0), y2: viewBoxSize - halfCell };
        case 'col_1': return { x1: pos(1), y1: halfCell, x2: pos(1), y2: viewBoxSize - halfCell };
        case 'col_2': return { x1: pos(2), y1: halfCell, x2: pos(2), y2: viewBoxSize - halfCell };
        case 'col_3': return { x1: pos(3), y1: halfCell, x2: pos(3), y2: viewBoxSize - halfCell };
        case 'col_4': return { x1: pos(4), y1: halfCell, x2: pos(4), y2: viewBoxSize - halfCell };
        case 'diag_tlbr': return { x1: halfCell, y1: halfCell, x2: viewBoxSize - halfCell, y2: viewBoxSize - halfCell };
        case 'diag_trbl': return { x1: viewBoxSize - halfCell, y1: halfCell, x2: halfCell, y2: viewBoxSize - halfCell };
        case 'xPattern': return [{...getLineCoords('diag_tlbr'), k: 'd1'}, {...getLineCoords('diag_trbl'), k: 'd2'}];
        case 'full_house': return ['row_0','row_1','row_2','row_3','row_4'].map(l => ({...getLineCoords(l), k:l}));
        case 'four_corners': return null;
        case 'custom_win': return [getLineCoords('row_2')];
        default: return null;
      }
    };
    const linesToDraw = winningLines.flatMap(line => getLineCoords(line) || []);
    return (
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        {linesToDraw.map((coords, index) => <line key={coords.k || index} {...coords} stroke="red" strokeWidth="2" strokeLinecap="round"/>)}
      </svg>
    );
});

// ========================================================================
// --- MAIN REACT COMPONENT ---
// ========================================================================
function CheckClaimModal({ isOpen, onClose, gameId, verifyBet, drawnNumbers = [], winningPatternName, customPatternGrid }) {
  const modalRef = useRef(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [claimResult, setClaimResult] = useState(null);
  const [instantResult, setInstantResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [cardMatrix, setCardMatrix] = useState(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
      setTicketNumber('');
      setClaimResult(null);
      setInstantResult(null);
      setIsChecking(false);
      setCardMatrix(null);
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  const handleCheckClaim = async (e) => {
    e.preventDefault();
    if (!ticketNumber || !gameId || isChecking) return;

    setIsChecking(true);
    setClaimResult(null);
    setInstantResult(null);

    const cardString = FIXED_BINGO_CARDS[ticketNumber];
    if (!cardString) {
      setCardMatrix(null);
      setInstantResult({ isValid: false, message: `Ticket #${ticketNumber} is not a valid card.` });
      setIsChecking(false);
      return;
    }
    
    setCardMatrix(parseBingoCardString(cardString));

    const clientResult = verifyWinOnClient(cardString, drawnNumbers, { name: winningPatternName, customGrid: customPatternGrid });
    setInstantResult(clientResult);

    try {
      const serverResponse = await verifyBet(gameId, ticketNumber);
      setClaimResult(serverResponse);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to check claim.';
      setClaimResult({ isValid: false, message: errorMessage });
    } finally {
      setIsChecking(false);
    }
  };

  const finalResult = claimResult || instantResult;

  return (
    <dialog id="check_claim_modal" className="modal modal-bottom sm:modal-middle" ref={modalRef}>
      <div className="modal-box w-auto max-w-sm bg-red-700 p-4 rounded-lg 
      shadow-xl text-white border-2 border-red-900">
        <div className="flex items-center justify-between pb-2 mb-4">
          <h3 className="font-bold text-xl">Check Claim</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
        </div>
        
        <form className="flex items-end gap-2 mb-4" onSubmit={handleCheckClaim}>
          <div className="flex-grow">
            <label className="block text-white text-sm font-bold mb-1">Ticket Number</label>
            <input type="number" className="input input-bordered w-full bg-white text-black" value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} required autoFocus/>
          </div>
          <button type="submit" className="btn bg-blue-600 hover:bg-blue-700 text-white h-12 border-none" disabled={isChecking}>
            {isChecking ? <span className="loading loading-spinner"></span> : 'Check'}
          </button>
        </form>

        <div className="bg-red-800 p-4 rounded-lg">
          <div className="grid grid-cols-5 gap-2 text-center font-bold text-xl mb-2">
              {['B', 'I', 'N', 'G', 'O'].map(l => <div key={l}>{l}</div>)}
          </div>
          <div className="relative grid grid-cols-5 gap-2">
            {cardMatrix ? (
              cardMatrix.flat().map((number, index) => {
                const isCalled = number === 'FREE' || drawnNumbers.includes(number);
                return (
                  <div key={index} className={`aspect-square flex items-center justify-center rounded text-lg font-bold shadow-inner ${isCalled ? 'bg-green-500 text-white' : 'bg-white text-black'}`}>
                    {number}
                  </div>
                );
              })
            ) : (
              <div className="col-span-5 text-center py-8 text-white/70">Enter a ticket number to check.</div>
            )}
            
            {finalResult?.isValid && (
              <WinningLineOverlay winningLines={finalResult.winningLines} />
            )}
          </div>

          <div className={`mt-4 h-16 flex flex-col items-center justify-center p-2 rounded bg-red-900/50 transition-all duration-300`}>
              {isChecking && !claimResult ? (
                  <p className="text-white/90">Verifying with server...</p>
              ) : !finalResult ? (
                  <p className="text-white/70">Result will be shown here.</p>
              ) : finalResult.isValid ? (
                  <h2 className="text-3xl font-extrabold text-yellow-300 animate-pulse">BINGO!</h2>
              ) : (
                  <div>
                      <p className="text-lg font-bold text-red-300">Not a Winner</p>
                      <p className="text-xs text-white/80 mt-1 max-w-[250px] text-center">{finalResult.message}</p>
                  </div>
              )}
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default CheckClaimModal;