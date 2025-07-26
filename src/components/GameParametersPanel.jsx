// --- START OF FILE GameParametersPanel.jsx ---
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

// Helper to generate all 5 horizontal line patterns
const getAllHorizontalLinePatterns = () => {
    const patterns = [];
    for (let i = 0; i < 5; i++) {
        const p = Array(5).fill(0).map(() => Array(5).fill(false));
        p[i].fill(true);
        patterns.push(p);
    }
    return patterns;
};

// Helper to generate all 5 vertical line patterns
const getAllVerticalLinePatterns = () => {
    const patterns = [];
    for (let i = 0; i < 5; i++) {
        const p = Array(5).fill(0).map(() => Array(5).fill(false));
        p.forEach(row => row[i] = true);
        patterns.push(p);
    }
    return patterns;
};

// Helper to generate common two-line patterns for animation
const getAllAnyTwoLinesPatterns = () => {
    const patterns = [];
    // Horizontal pairs
    for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
            const p = Array(5).fill(0).map(() => Array(5).fill(false));
            p[i].fill(true);
            p[j].fill(true);
            patterns.push(p);
        }
    }
    // Vertical pairs
    for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
            const p = Array(5).fill(0).map(() => Array(5).fill(false));
            p.forEach(row => row[i] = true);
            p.forEach(row => row[j] = true);
            patterns.push(p);
        }
    }
    // One Horizontal and One Vertical
    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const p = Array(5).fill(0).map(() => Array(5).fill(false));
            p[r].fill(true);
            p.forEach(row => row[c] = true);
            patterns.push(p);
        }
    }
    // Diagonal pairs (TLBR + any line, TRBL + any line) - simplified
    const diagonalTLBR = Array(5).fill(0).map((_, i) => Array(5).fill(false).map((_, j) => i === j));
    const diagonalTRBL = Array(5).fill(0).map((_, i) => Array(5).fill(false).map((_, j) => i + j === 4));

    // Diagonal TLBR + a horizontal line (e.g., row 0)
    let p_diag_h = JSON.parse(JSON.stringify(diagonalTLBR));
    p_diag_h[0].fill(true); patterns.push(p_diag_h);
    
    // Diagonal TRBL + a vertical line (e.g., col 0)
    let p_diag_v = JSON.parse(JSON.stringify(diagonalTRBL));
    p_diag_v.forEach(row => row[0] = true); patterns.push(p_diag_v);

    return patterns;
};


function GameParametersPanel({
  betAmount, setBetAmount, houseEdge, setHouseEdge,
  winningPattern, setWinningPattern, onStartGame, isStartGameDisabled,
  winningPatterns, currentVisualPattern, // Base pattern for predefined patterns (e.g., just middle line)
  customPatternDefinition, setCustomPatternDefinition // State for custom pattern
}) {
  // State to hold the pattern currently being displayed by the animation
  const [animatedDisplayPattern, setAnimatedDisplayPattern] = useState(
    Array(5).fill(0).map(() => Array(5).fill(false)) // Initialize with all white
  );

  // Animation control refs
  const animationIntervalRef = useRef(null);
  const animationSequenceIndexRef = useRef(0); // Current index in animation sequence array

  // --- Unified Animation Logic useEffect ---
  useEffect(() => {
    // Clear any existing animation intervals
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    animationSequenceIndexRef.current = 0; // Reset animation index

    // Get the base pattern for static patterns or the source for animation
    const sourcePattern = winningPattern === 'custom' ? customPatternDefinition : currentVisualPattern;
    const animationSpeed = 500; // Default animation speed (e.g., for blinking/stepping)

    // Handle 'custom' pattern separately: no animation, just direct display
    if (winningPattern === 'custom') {
      setAnimatedDisplayPattern(sourcePattern);
      return;
    }

    // --- Generate animation sequence based on winningPattern type ---
    let sequenceOfFrames = []; // Each element is a 5x5 boolean grid (a frame of the animation)

    const generalBlinkPatterns = ['fullHouse', 'diagonalTLBR', 'diagonalTRBL', 'fourCorners', 'xPattern'];

    if (generalBlinkPatterns.includes(winningPattern)) {
      // For general blinking patterns: toggle between pattern and all white
      sequenceOfFrames = [
        sourcePattern, // Pattern ON
        Array(5).fill(0).map(() => Array(5).fill(false)) // Pattern OFF (all white)
      ];
    } else if (winningPattern === 'horizontalLine') {
      // For horizontal lines: cycle through all 5 horizontal lines
      sequenceOfFrames = getAllHorizontalLinePatterns();
    } else if (winningPattern === 'verticalLine') {
      // For vertical lines: cycle through all 5 vertical lines
      sequenceOfFrames = getAllVerticalLinePatterns();
    } else if (winningPattern === 'anyTwoLines') {
      // For 'anyTwoLines': cycle through a predefined set of two-line patterns
      sequenceOfFrames = getAllAnyTwoLinesPatterns();
    } else {
      // Default: If pattern not found or no specific animation, just display static
      setAnimatedDisplayPattern(sourcePattern);
      return;
    }

    // --- Start the animation interval if sequenceOfFrames is populated ---
    if (sequenceOfFrames.length > 0) {
      animationIntervalRef.current = setInterval(() => {
        setAnimatedDisplayPattern(sequenceOfFrames[animationSequenceIndexRef.current]);

        // Move to the next frame, loop back if at end
        animationSequenceIndexRef.current = (animationSequenceIndexRef.current + 1) % sequenceOfFrames.length;
      }, animationSpeed);
    }

    // Cleanup function: clear interval when component unmounts or dependencies change
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [winningPattern, currentVisualPattern, customPatternDefinition]); // Dependencies

  // --- Custom Pattern Interaction ---
  const toggleCustomCell = useCallback((rowIndex, colIndex) => {
    if (winningPattern === 'custom') {
      setCustomPatternDefinition(prevGrid => {
        const newGrid = JSON.parse(JSON.stringify(prevGrid)); // Deep copy
        newGrid[rowIndex][colIndex] = !newGrid[rowIndex][colIndex];
        return newGrid;
      });
    }
  }, [winningPattern, setCustomPatternDefinition]);

  const handleClearCustomPattern = useCallback(() => {
    if (winningPattern === 'custom') {
      setCustomPatternDefinition(Array(5).fill(0).map(() => Array(5).fill(false)));
    }
  }, [winningPattern, setCustomPatternDefinition]);

  // Handle change for input field (allows empty string)
  const handleBetAmountChange = (e) => {
    const inputValue = e.target.value;
    setBetAmount(inputValue === '' ? '' : Number(inputValue));
  };

  // Handle increment/decrement for Bet Amount
  const adjustBetAmount = (amount) => {
    const currentVal = Number(betAmount) || 0;
    // Leaving this as Math.max(1, ...) as per original functionality.
    // If a hard minimum of 10 is desired, change '1' to '10'.
    setBetAmount(Math.max(1, currentVal + amount)); 
  };

  // Handle change for input field (allows empty string)
  const handleHouseEdgeChange = (e) => {
    const inputValue = e.target.value;
    setHouseEdge(inputValue === '' ? '' : Number(inputValue));
  };

  // Handle increment/decrement for House Edge
  const adjustHouseEdge = (amount) => {
    const currentVal = Number(houseEdge) || 0;
    setHouseEdge(Math.max(0, currentVal + amount)); // Minimum house edge of 0
  };

  const handleWinningPatternChange = (e) => setWinningPattern(e);

  return (
    <div className="flex h-full flex-col justify-between space-y-2 gap-y-4">
      <div className="flex h-full w-full flex-col justify-between rounded-lg bg-[#FFFFFF1A] p-4">
        {/* Bet Amount */}
        <div>
          <p className="mb-2 text-base font-semibold text-white">Bet Amount</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn btn-square"
              onClick={() => adjustBetAmount(-1)}
            >
              -
            </button>
            <input
              type="number"
              value={typeof betAmount === 'number' ? betAmount : ''}
              onChange={handleBetAmountChange}
              className="input input-bordered w-full bg-white text-black"
            />
            <button
              type="button"
              className="btn btn-square"
              onClick={() => adjustBetAmount(1)}
            >
              +
            </button>
          </div>
        </div>
        {/* House Edge (%) */}
        <div>
          <p className="mb-2 text-base font-semibold text-white">House Edge (%)</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn btn-square"
              onClick={() => adjustHouseEdge(-5)}
            >
              -
            </button>
            <input
              type="number"
              value={typeof houseEdge === 'number' ? houseEdge : ''}
              onChange={handleHouseEdgeChange}
              className="input input-bordered w-full bg-white text-black"
            />
            <button
              type="button"
              className="btn btn-square"
              onClick={() => adjustHouseEdge(5)}
            >
              +
            </button>
          </div>
        </div>

        {/* Winning Pattern Select */}
        <div className="mt-4">
          <p className="mb-2 text-base font-semibold text-white">Winning Pattern</p>
          <select
            className="select select-bordered w-full bg-white text-black"
            value={winningPattern}
            onChange={handleWinningPatternChange}
          >
            {Object.keys(winningPatterns).map((key) => (
                <option key={key} value={key}>{winningPatterns[key].name}</option>
            ))}
          </select>
        </div>

        {/* Bingo Grid (Visual Pattern Display) */}
        <div className="mt-4 p-4 rounded-lg bg-dama-red-light text-center border border-white">
          <p className="font-bold text-white mb-2 text-xl">B I N G O</p>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <div key={`col-${colIndex}`} className="flex flex-col gap-1">
                {Array.from({ length: 5 }).map((_, rowIndex) => {
                    const isHighlighted = animatedDisplayPattern[rowIndex]?.[colIndex];
                    
                    return (
                        <motion.div
                            key={`cell-${colIndex}-${rowIndex}`} // Static key for continuous presence
                            layout
                            animate={{
                                backgroundColor: isHighlighted ? '#22c55e' : '#ffffff', 
                                scale: isHighlighted ? 1.05 : 1,
                            }}
                            transition={{
                                duration: 0.2, // Fast transition for color change
                                ease: "easeInOut",
                            }}
                            className={`h-10 w-full rounded-sm flex items-center justify-center text-black ${
                                winningPattern === 'custom' ? 'cursor-pointer' : '' // Add cursor for custom
                            }`}
                            onClick={winningPattern === 'custom' ? () => toggleCustomCell(rowIndex, colIndex) : undefined}
                        >
                            {/* Empty placeholder for cells */}
                        </motion.div>
                    );
                })}
              </div>
            ))}
          </div>

          {/* Custom Pattern Controls */}
          {winningPattern === 'custom' && (
            <div className="mt-4 flex justify-between gap-2">
                <button
                    type="button"
                    className="btn flex-1 h-[40px] rounded-[8px] border-[#00000033] bg-[#00000033] px-5 py-1 font-semibold text-white"
                    onClick={handleClearCustomPattern}
                >
                    Clear Pattern
                </button>
            </div>
          )}
        </div>
      </div>

      {/* Start Game button */}
      <div className="w-full">
        <div className="pb-3">
          <button
            type="button"
            className="btn h-[6vh] w-full rounded-[8px] border-[#00000033] bg-[#00000033] px-5 py-1 font-semibold text-white"
            onClick={onStartGame}
            disabled={isStartGameDisabled}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameParametersPanel;