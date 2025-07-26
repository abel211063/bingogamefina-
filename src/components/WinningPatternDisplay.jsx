// --- START OF FILE WinningPatternDisplay.jsx ---
// src/components/WinningPatternDisplay.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function (needs to be consistent with App.jsx's getBingoLetter)
const getBingoLetter = (num) => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};

// Replicate pattern generation helpers from GameParametersPanel.jsx
const getAllHorizontalLinePatterns = () => {
    const patterns = [];
    for (let i = 0; i < 5; i++) {
        const p = Array(5).fill(0).map(() => Array(5).fill(false));
        p[i].fill(true);
        patterns.push(p);
    }
    return patterns;
};

const getAllVerticalLinePatterns = () => {
    const patterns = [];
    for (let i = 0; i < 5; i++) {
        const p = Array(5).fill(0).map(() => Array(5).fill(false));
        p.forEach(row => row[i] = true);
        patterns.push(p);
    }
    return patterns;
};

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

    let p_diag_h = JSON.parse(JSON.stringify(diagonalTLBR));
    p_diag_h[0].fill(true); patterns.push(p_diag_h);
    
    let p_diag_v = JSON.parse(JSON.stringify(diagonalTRBL));
    p_diag_v.forEach(row => row[0] = true); patterns.push(p_diag_v);

    return patterns;
};

// Helper function to get the *base* static pattern (used for non-animated display or as source for animation)
const getBaseVisualPattern = (patternName, customPatternGrid) => {
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
            pattern[0][0] = true; pattern[0][4] = true;
            pattern[4][0] = true; pattern[4][4] = true;
            break;
        case 'xPattern':
            pattern.forEach((row, i) => { row[i] = true; row[4 - i] = true; });
            break;
        case 'custom':
            return customPatternGrid; // For custom, use the passed grid directly
        default:
            break;
    }
    return pattern;
};


export default function WinningPatternDisplay({ 
  lastCalledNumber,
  winningPatternName, // e.g., 'anyTwoLines', 'fullHouse', 'custom'
  customPatternGrid // 5x5 boolean grid if winningPatternName is 'custom'
}) {
  const [animatedDisplayPattern, setAnimatedDisplayPattern] = useState(
    getBaseVisualPattern(winningPatternName, customPatternGrid) // Initialize with the base pattern
  );
  
  const animationIntervalRef = useRef(null);
  const animationSequenceIndexRef = useRef(0);

  // --- Animation Logic useEffect ---
  useEffect(() => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
    animationSequenceIndexRef.current = 0; 

    // Get the base pattern for static patterns or the source for animation
    const baseSourcePattern = getBaseVisualPattern(winningPatternName, customPatternGrid);
    const animationSpeed = 700; // Animation speed

    // Handle 'custom' pattern separately: no animation, just direct display
    if (winningPatternName === 'custom') {
      setAnimatedDisplayPattern(customPatternGrid); // Direct use of custom grid
      return;
    }

    let sequenceOfFrames = [];

    const generalBlinkPatterns = ['fullHouse', 'diagonalTLBR', 'diagonalTRBL', 'fourCorners', 'xPattern'];

    if (generalBlinkPatterns.includes(winningPatternName)) {
      sequenceOfFrames = [
        baseSourcePattern, // Pattern ON
        Array(5).fill(0).map(() => Array(5).fill(false)) // Pattern OFF (all white)
      ];
    } else if (winningPatternName === 'horizontalLine') {
      sequenceOfFrames = getAllHorizontalLinePatterns();
    } else if (winningPatternName === 'verticalLine') {
      sequenceOfFrames = getAllVerticalLinePatterns();
    } else if (winningPatternName === 'anyTwoLines') {
      sequenceOfFrames = getAllAnyTwoLinesPatterns();
    } else {
      // Default: If pattern not found or no specific animation, just display static
      setAnimatedDisplayPattern(baseSourcePattern);
      return;
    }

    if (sequenceOfFrames.length > 0) {
      animationIntervalRef.current = setInterval(() => {
        setAnimatedDisplayPattern(sequenceOfFrames[animationSequenceIndexRef.current]);
        animationSequenceIndexRef.current = (animationSequenceIndexRef.current + 1) % sequenceOfFrames.length;
      }, animationSpeed);
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [winningPatternName, customPatternGrid]); // Dependencies: if pattern changes, restart animation

  const lastCalledVariants = {
    hidden: { x: '150%', y: '150%', rotate: 360, opacity: 0, scale: 0.5, filter: 'blur(10px)' },
    visible: {
      x: '0%', y: '0%', rotate: 0, opacity: 1, scale: 1, filter: 'blur(0px)',
      transition: { type: 'spring', stiffness: 120, damping: 10, mass: 1, delay: 0.2 },
    },
    exit: { x: '-150%', y: '-150%', rotate: -360, opacity: 0, scale: 0.5, transition: { duration: 0.5 } } // Added exit animation
  };

  return (
    <div className="flex flex-col h-full rounded-lg bg-[#FFFFFF1A] p-4 items-center">
      <h2 className="text-xl font-bold text-white mb-4 text-center">Winning Pattern</h2>
      
      {/* Display Last Called Number prominently */}
      <div className="flex-shrink-0 mb-6">
        <AnimatePresence mode="wait"> {/* Use AnimatePresence for exit animations */}
          {lastCalledNumber ? (
            <motion.div
              key={lastCalledNumber.number} // Unique key ensures re-animation on new number
              variants={lastCalledVariants}
              initial="hidden"
              animate="visible"
              exit="exit" // Use the exit variant
              className="relative w-32 h-32 text-4xl md:w-48 md:h-48 md:text-6xl lg:w-56 lg:h-56 lg:text-7xl // Adjusted sizes
                        flex items-center justify-center rounded-full text-white font-extrabold shadow-2xl
                        bg-gradient-to-br from-dama-success-dark to-dama-success
                        border-4 border-white overflow-hidden group" // Changed to green theme
            >
              <div className="absolute inset-0 rounded-full bg-white bg-opacity-20 transform scale-105 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ clipPath: 'ellipse(50% 25% at 50% 75%)', filter: 'blur(2px)' }}></div>
              <div className="absolute inset-0 rounded-full bg-white bg-opacity-10 transform scale-95 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ clipPath: 'ellipse(25% 50% at 75% 50%)', filter: 'blur(1px)' }}></div>
              <span className="relative z-10">{getBingoLetter(lastCalledNumber.number)}{lastCalledNumber.number}</span>
            </motion.div>
          ) : (
            <div className="w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full bg-gray-700 bg-opacity-30 flex items-center justify-center text-center text-gray-400 text-sm md:text-base"> {/* Responsive text for "Waiting" */}
                <p>Waiting for first call...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* BINGO Grid for Winning Pattern Display */}
      {/* Removed the "B I N G O" title from here */}
      <div className="mt-auto p-4 rounded-lg bg-dama-red-light text-center border border-white w-full max-w-sm">
          {/* Removed: <p className="font-bold text-white mb-2 text-xl">B I N G O</p> */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <div key={`col-${colIndex}`} className="flex flex-col gap-1">
                {Array.from({ length: 5 }).map((_, rowIndex) => {
                    const isHighlighted = animatedDisplayPattern[rowIndex]?.[colIndex];
                    
                    return (
                        <motion.div
                            key={`cell-${colIndex}-${rowIndex}`} 
                            initial={false} 
                            animate={{
                                backgroundColor: isHighlighted ? '#22c55e' : '#ffffff', // Green for highlight, white for others
                                scale: isHighlighted ? 1.05 : 1,
                            }}
                            transition={{
                                duration: 0.2, 
                                ease: "easeInOut",
                            }}
                            className={`h-10 w-full rounded-sm flex items-center justify-center text-black`}
                        >
                            {/* Empty placeholder for cells */}
                        </motion.div>
                    );
                })}
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}