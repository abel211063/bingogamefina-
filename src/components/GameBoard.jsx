// --- START OF FILE GameBoard.jsx ---
import React, { useState, useEffect, useRef, useCallback } from 'react'; // <--- ADD useCallback HERE
import { motion } from 'framer-motion';

// Helper function (should be consistent with App.jsx's getBingoLetter)
const getBingoLetter = (num) => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};

// Helper function to get the row/col index of a Bingo number (0-indexed)
// This is not precise for row index, as real bingo cards have random numbers.
// For *displaying* a pattern, we need a consistent grid representation.
// Let's use a simplified mapping for visual purposes, mapping numbers 1-15 to rows 0-4
// within their respective columns. This is an *arbitrary* mapping for visualization.
const getGridPosition = (num) => {
  if (num >= 1 && num <= 15) return { col: 0, row: (num - 1) % 5 };
  if (num >= 16 && num <= 30) return { col: 1, row: (num - 16) % 5 };
  if (num >= 31 && num <= 45) return { col: 2, row: (num - 31) % 5 };
  if (num >= 46 && num <= 60) return { col: 3, row: (num - 46) % 5 };
  if (num >= 61 && num <= 75) return { col: 4, row: (num - 61) % 5 };
  return null;
};


export default function GameBoard({ 
  drawnNumbers = [], 
  lastCalledNumber,
  winningPatternName, // e.g., 'anyTwoLines', 'fullHouse', 'custom'
  customPatternGrid // 5x5 boolean grid if winningPatternName is 'custom'
}) {
  const isLastCalled = (num) => lastCalledNumber && num === lastCalledNumber.number;
  const isLastCalledLetter = (letter) => lastCalledNumber && lastCalledNumber.letter === letter;

  // State to manage the blinking of the winning pattern
  const [isPatternHighlightOn, setIsPatternHighlightOn] = useState(true);
  const patternBlinkIntervalRef = useRef(null);

  // Derive the target winning pattern for display
  const getTargetWinningPattern = useCallback(() => {
    if (winningPatternName === 'custom' && customPatternGrid) {
      return customPatternGrid;
    }
    
    // For predefined patterns, we need to generate their 5x5 grid representation
    // These patterns are for DISPLAY ONLY on the GameBoard, indicating the *type* of win
    const pattern = Array(5).fill(0).map(() => Array(5).fill(false)); 
    switch (winningPatternName) {
      case 'anyTwoLines':
          // Display a general "any two lines" visual, e.g., Top Row and Bottom Row
          pattern[0].fill(true); 
          pattern[4].fill(true); 
          break;
      case 'fullHouse':
          pattern.forEach(row => row.fill(true));
          break;
      case 'horizontalLine': 
          // For "Any Horizontal Line", fill all rows to show it applies to any horizontal
          pattern.forEach(row => row.fill(true));
          break;
      case 'verticalLine': 
          // For "Any Vertical Line", fill all columns to show it applies to any vertical
          pattern.forEach((row, rIdx) => row.forEach((_, cIdx) => pattern[rIdx][cIdx] = true)); 
          break;
      case 'diagonalTLBR':
          pattern.forEach((row, i) => row[i] = true);
          break;
      case 'diagonalTRBL':
          pattern.forEach((row, i) => row[4 - i] = true);
          break;
      case 'fourCorners':
          pattern[0][0] = true; pattern[0][4] = true;
          pattern[4][0] = true; pattern[4][4] = true;
          break;
      case 'xPattern':
          pattern.forEach((row, i) => { row[i] = true; row[4 - i] = true; });
          break;
      default:
          break;
    }
    return pattern;
  }, [winningPatternName, customPatternGrid]); // Dependencies for useCallback


  useEffect(() => {
    // Clear any previous interval
    if (patternBlinkIntervalRef.current) {
      clearInterval(patternBlinkIntervalRef.current);
    }

    // Determine if the current pattern (either predefined or custom) has any cells active
    const actualPatternHasActiveCells = winningPatternName === 'custom' 
        ? (customPatternGrid && customPatternGrid.flat().some(cell => cell)) 
        : (getTargetWinningPattern().flat().some(cell => cell)); // Check if any true cells exist in the derived pattern

    // Start blinking animation for winning pattern when game is in progress
    // and if there's an actual pattern to show
    if (actualPatternHasActiveCells) {
      setIsPatternHighlightOn(true); // Start with pattern visible
      patternBlinkIntervalRef.current = setInterval(() => {
        setIsPatternHighlightOn(prev => !prev);
      }, 700); // Blink every 0.7 seconds
    } else {
      setIsPatternHighlightOn(false); // No pattern to blink or game not active
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (patternBlinkIntervalRef.current) {
        clearInterval(patternBlinkIntervalRef.current);
      }
    };
  }, [winningPatternName, customPatternGrid, getTargetWinningPattern]); // Add getTargetWinningPattern to dependencies


  // Animation variants for the prominent last called number
  const lastCalledVariants = {
    hidden: { x: '150%', y: '150%', rotate: 360, opacity: 0, scale: 0.5, filter: 'blur(10px)' },
    visible: {
      x: '0%', y: '0%', rotate: 0, opacity: 1, scale: 1, filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 120, damping: 10, mass: 1, delay: 0.2 },
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg bg-[#FFFFFF1A] p-4">
      <h2 className="text-xl font-bold text-white mb-4 text-center">Called Numbers</h2>
      
      {/* Display Last Called Number prominently */}
      {lastCalledNumber && (
        <motion.div
          key={lastCalledNumber.number} // Unique key ensures re-animation on new number
          variants={lastCalledVariants}
          initial="hidden"
          animate="visible"
          className="bg-dama-red-dark border border-white text-white p-6 rounded-lg text-center shadow-2xl mb-6 flex-shrink-0 relative overflow-hidden"
          style={{
            width: '180px',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            // --- Pool Ball Look ---
            background: 'radial-gradient(circle at 30% 30%, #fff, #888 20%, #444 80%, #000)',
            boxShadow: '0 0 15px rgba(0,0,0,0.8), inset 0 0 10px rgba(255,255,255,0.5)',
            color: 'white', 
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
            fontWeight: 'bold',
            fontSize: '3rem',
            // Ensure content isn't cut off by overflow:hidden, important for visual details
            overflow: 'visible' 
          }}
        >
          <span className="text-5xl font-extrabold relative z-10">{lastCalledNumber.letter}{lastCalledNumber.number}</span>
          {/* Subtle highlight for the ball surface to enhance 3D effect */}
          <div style={{
              position: 'absolute',
              top: '5%', left: '5%',
              width: '20%', height: '20%',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              filter: 'blur(5px)',
              zIndex: 0
          }}></div>
        </motion.div>
      )}

      {/* Main Board - numbers grouped by BINGO letters */}
      {/* Position relative and z-index context for overlay */}
      <div className="flex h-full w-full items-start justify-between mt-auto relative">
        {/* Overlay for winning pattern highlight */}
        {/* This overlay must align perfectly with the number cells */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Grid layout for overlay, matching the number cells below */}
          <div className="grid grid-cols-5 gap-2 p-1 h-full">
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <div key={`pattern-col-wrapper-${colIndex}`} className="flex flex-col gap-2 w-full">
                {Array.from({ length: 5 }).map((_, rowIndex) => {
                  const targetPattern = getTargetWinningPattern();
                  const isPatternCell = targetPattern[rowIndex]?.[colIndex]; // Check for undefined rows/cols
                  
                  // Only show highlight if it's a pattern cell and the highlight is currently "on"
                  const showHighlight = isPatternCell && isPatternHighlightOn;

                  return (
                    <motion.div
                      key={`pattern-cell-${colIndex}-${rowIndex}`}
                      initial={false} // No initial animation, only animate on prop change
                      animate={{ 
                          backgroundColor: showHighlight ? 'rgba(0,255,0,0.3)' : 'rgba(0,0,0,0)', // Green overlay or transparent
                          scale: showHighlight ? 1.1 : 1 // Slightly larger when highlighted
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-14 h-14 rounded-full" // Match size and shape of number balls
                      style={{
                        pointerEvents: 'none', // Ensure clicks go through to elements below
                      }}
                    ></motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* BINGO Columns below the overlay */}
        {['B', 'I', 'N', 'G', 'O'].map((letter, colIndex) => (
          // Individual column for B, I, N, G, O letters and their called numbers
          <div key={letter} className="flex flex-col w-full items-center justify-center p-1 z-20"> {/* Higher z-index for numbers */}
            <h3 className={`text-2xl font-bold mb-2 ${isLastCalledLetter(letter) ? 'text-dama-success' : 'text-white'}`}>{letter}</h3>
            <div className="flex flex-col gap-2 w-full items-center">
              {/* Loop for numbers 1-15, 16-30 etc. */}
              {Array.from({ length: 15 }, (_, i) => i + 1 + (colIndex * 15))
                .filter(num => drawnNumbers.includes(num)) // Only show drawn numbers
                .map(num => (
                  <motion.div
                    key={num}
                    layout // Smoothly animate position changes as items are added/removed
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg border-2 ${
                      isLastCalled(num) 
                        ? 'bg-dama-success text-white border-white animate-pulse' // Last called number is green
                        : 'bg-purple-700 text-white border-purple-900' // Changed to purple for other called numbers
                    }`}
                  >
                    <span className="text-lg font-bold">{getBingoLetter(num)}{num}</span>
                  </motion.div>
                ))
              }
            </div>
          </div>
        ))}
      </div>
      
      {drawnNumbers.length === 0 && !lastCalledNumber && (
        <p className="text-gray-400 w-full text-center mt-auto">Waiting for the first number...</p>
      )}
    </div>
  );
}
// --- END OF FILE GameBoard.jsx ---