// --- START OF FILE AllNumbersGrid.jsx ---
// src/components/AllNumbersGrid.jsx
import React from 'react';

const getBingoLetter = (num) => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};

const AllNumbersGrid = ({ drawnNumbers = [], lastCalledNumber }) => {
  const isCalled = (num) => drawnNumbers.includes(num);
  const isLastCalled = (num) => lastCalledNumber && num === lastCalledNumber.number;

  const numbers = Array.from({ length: 75 }, (_, i) => i + 1);

  return (
    <div className="w-full rounded-lg bg-[#FFFFFF1A] p-2 flex flex-col items-center">
      <h2 className="text-xl font-bold text-white mb-4">Called Numbers Board</h2>
      {/* Responsive grid: Significantly reduced sizes for compactness */}
      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-0.5 sm:gap-1 w-full max-w-4xl mx-auto p-1"> {/* Reduced gap */}
        {numbers.map((num) => {
          const letter = getBingoLetter(num);
          const isCalledNum = isCalled(num);
          const isLastCalledNum = isLastCalled(num);

          // Smaller ball size and text size for all screen sizes
          const ballSizeClasses = "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10"; // Reduced sizes
          const textSizeClasses = "text-xs sm:text-xs md:text-sm"; // Reduced sizes

          // If the number has NOT been called, render an empty div as a placeholder to maintain grid structure
          if (!isCalledNum) {
            return <div key={num} className={ballSizeClasses}></div>; 
          }

          // If the number HAS been called, render the styled ball
          let bgColor = '';
          let textColor = 'text-white'; // Default text color for all called numbers

          if (isLastCalledNum) {
            // Last called number overrides other colors with a bright green
            bgColor = 'bg-green-500'; // Bright green
          } else {
            // Other called numbers colored based on their BINGO letter
            if (letter === 'B') {
              bgColor = 'bg-green-700'; // Darker green for B
            } else if (letter === 'I') {
              bgColor = 'bg-black'; // Black for I
            } else { 
              // N, G, O default to purple
              bgColor = 'bg-purple-700'; 
            }
          }

          return (
            <div
              key={num}
              className={`${ballSizeClasses} ${textSizeClasses}
                          flex-shrink-0 flex items-center justify-center rounded-full font-bold
                          ${bgColor} ${textColor}
                          ${isLastCalledNum ? 'border-2 border-white animate-pulse' : 'border-2 border-transparent'}
                          transition-all duration-200 ease-in-out`}
            >
              {letter}{num}
            </div>
          );
        })}
      </div>
      {drawnNumbers.length === 0 && (
        <p className="text-gray-400 text-center mt-4">No numbers have been called yet.</p>
      )}
    </div>
  );
};

export default AllNumbersGrid;