// src/components/BallDisplay.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BallDisplay = ({ lastDrawnNumber }) => {
  const ballVariants = {
    hidden: { x: '100vw', y: '100vh', opacity: 0, rotate: 0 },
    visible: {
      x: '0%',
      y: '0%',
      opacity: 1,
      rotate: 360 * 2,
      transition: {
        type: 'spring',
        stiffness: 70,
        damping: 10,
        duration: 1.5,
      },
    },
    exit: { x: '-100vw', opacity: 0, transition: { duration: 0.5 } }
  };

  if (!lastDrawnNumber) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <div className="w-48 h-48 rounded-full bg-gray-700 bg-opacity-30 flex items-center justify-center text-center">
            <p>Waiting for first call...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={lastDrawnNumber}
        variants={ballVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="relative w-48 h-48 flex items-center justify-center
                   rounded-full text-white font-extrabold text-6xl shadow-2xl
                   bg-gradient-to-br from-blue-700 to-blue-900 border-4 border-blue-400
                   overflow-hidden group cursor-pointer"
      >
        <div className="absolute inset-0 rounded-full
                        bg-white bg-opacity-20 transform scale-105 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
            clipPath: 'ellipse(50% 25% at 50% 75%)',
            filter: 'blur(2px)'
        }}></div>
        <div className="absolute inset-0 rounded-full
                        bg-white bg-opacity-10 transform scale-95 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
            clipPath: 'ellipse(25% 50% at 75% 50%)',
            filter: 'blur(1px)'
        }}></div>

        {lastDrawnNumber}
      </motion.div>
    </AnimatePresence>
  );
};

export default BallDisplay;