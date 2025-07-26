// --- START OF FILE LastFiveCalls.jsx ---
// components/LastFiveCalls.jsx
import React from 'react';
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

const LastFiveCalls = ({ drawnNumbers, lastCalledNumber }) => { // Added lastCalledNumber prop
  // Get the last 5 numbers. Use reverse to show most recent on the left if desired.
  const lastFive = drawnNumbers.slice(-5).reverse(); 

  // New helper to check if a number is the last called number
  const isCurrentLastCalled = (num) => lastCalledNumber && num === lastCalledNumber.number;

  // Variants for individual number items to animate in/out
  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.5 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 10, stiffness: 100 } },
    exit: { opacity: 0, y: -50, scale: 0.5, transition: { duration: 0.2 } }
  };

  return (
    <div className="bg-[#FFFFFF1A] rounded-lg p-4 mt-2 w-full flex flex-col justify-center items-center">
      <h3 className="text-lg font-bold text-white mb-2 text-center">Last 5 Calls</h3>
      {/* Glass Tube Container */}
      <div 
        className="relative w-full overflow-hidden flex items-center justify-center h-[60px] sm:h-[70px] md:h-[80px] rounded-full"
        style={{
          // Main glass-like background and shadow
          background: 'linear-gradient(to right, rgba(255,255,255,0.1), rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.1)), rgba(255,255,255,0.1)',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        {/* Inner lines for tube effect (can be adjusted for density/look) */}
        <div className="absolute inset-0 z-0" style={{
            backgroundImage: 'repeating-linear-gradient(to right, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 2px, transparent 2px, transparent 15px)',
            backgroundSize: '30px 100%',
        }}></div>
        {/* Content (numbers) should be above the tube lines */}
        <div className="relative z-10 flex justify-center items-center gap-2 sm:gap-3 w-full h-full">
            <AnimatePresence initial={false}>
              {lastFive.length > 0 ? (
                lastFive.map((num) => (
                  <motion.div
                    key={num}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout // Smoothly animate position changes as items are added/removed
                    // Conditionally apply class based on whether it's the last called number
                    className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-sm sm:text-base md:text-xl font-bold shadow-md border-2
                                ${isCurrentLastCalled(num) ? 'bg-dama-success border-dama-success-dark animate-pulse' : 'bg-blue-700 border-blue-900'}
                                text-white`}
                  >
                    {getBingoLetter(num)}{num}
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No numbers called yet.</p>
              )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LastFiveCalls;