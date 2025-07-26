// src/components/LastCallsDisplay.jsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const LastCallsDisplay = ({ drawnNumbers = [] }) => {
  // Get the last 5 calls, most recent first, limit to avoid UI overload
  const lastFiveCalls = drawnNumbers.slice(-5).reverse(); 

  const itemVariants = {
    hidden: { x: '100%', opacity: 0, scale: 0.5 },
    visible: (i) => ({
      x: '0%',
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1, // Stagger animation for new items
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }),
    exit: { x: '-100%', opacity: 0, scale: 0.5, transition: { duration: 0.3 } }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-2 rounded-lg bg-[#FFFFFF1A]">
      <p className="text-xl font-semibold text-white mb-2">Last 5 Calls</p>
      <div className="flex-1 w-full flex flex-col-reverse justify-end items-center gap-1.5 overflow-hidden
                      bg-gray-800 bg-opacity-50 rounded-lg shadow-inner border border-blue-400 p-1.5">
        <AnimatePresence mode="popLayout">
          {lastFiveCalls.map((num, index) => (
            <motion.div
              key={num}
              layout // Animate position changes of existing items
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={index} // Pass index for staggered animation
              className="w-full h-12 flex-shrink-0 flex items-center justify-center
                         bg-blue-600 text-white text-lg font-bold rounded-md
                         shadow-md border border-blue-300 transform-gpu"
              style={{
                  transformOrigin: 'bottom center', // For popLayout from bottom
              }}
            >
              {num}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LastCallsDisplay;