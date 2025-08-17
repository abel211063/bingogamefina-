// --- START OF FILE src/components/ShuffleAnimationModal.jsx ---
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Helper to get the correct letter for a number
const getBingoLetter = (num) => {
    if (num >= 1 && num <= 15) return 'B';
    if (num >= 16 && num <= 30) return 'I';
    if (num >= 31 && num <= 45) return 'N';
    if (num >= 46 && num <= 60) return 'G';
    if (num >= 61 && num <= 75) return 'O';
    return '';
};

// Create a full deck of 75 correctly formatted bingo balls
const fullBingoDeck = Array.from({ length: 75 }, (_, i) => {
    const num = i + 1;
    return `${getBingoLetter(num)}${num}`;
});


function ShuffleAnimationModal({ isOpen, onClose }) {
  const modalRef = React.useRef(null);
  // State to hold the random selection of balls for the current animation
  const [displayBalls, setDisplayBalls] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Create a new random shuffle every time the modal opens
      const shuffled = [...fullBingoDeck].sort(() => Math.random() - 0.5);
      // Take the first 12 balls from the shuffled deck to display
      setDisplayBalls(shuffled.slice(0, 12));

      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Animation lasts for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);
  
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog ref={modalRef} className="modal bg-black/60">
      <div className="modal-box bg-transparent shadow-none w-auto flex flex-col items-center">
        <h3 className="font-bold text-3xl text-white mb-4">Shuffling...</h3>
        {/* MODIFIED: The container is now larger */}
        <div className="relative w-80 h-80 rounded-full border-4 border-white bg-black/30 overflow-hidden">
          {/* MODIFIED: Mapping over the random `displayBalls` state */}
          {displayBalls.map((ball, i) => (
            <motion.div
              key={ball}
              className="absolute top-1/2 left-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xl border-2 border-blue-300"
              style={{ x: '-50%', y: '-50%' }}
              animate={{
                x: `${Math.random() * 200 - 100}%`, // Wider random range for larger circle
                y: `${Math.random() * 200 - 100}%`,
              }}
              transition={{
                delay: i * 0.05,
                duration: 0.5 + Math.random() * 0.5, // Add randomness to duration
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut'
              }}
            >
              {ball}
            </motion.div>
          ))}
        </div>
      </div>
    </dialog>
  );
}

export default ShuffleAnimationModal;