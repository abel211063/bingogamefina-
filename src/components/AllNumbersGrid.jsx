// --- START OF FILE AllNumbersGrid.jsx ---
// src/components/AllNumbersGrid.jsx
import React from 'react';

const AllNumbersGrid = ({ drawnNumbers = [], lastCalledNumber }) => {
  const isCalled = (num) => drawnNumbers.includes(num);
  const isLastCalled = (num) => lastCalledNumber && num === lastCalledNumber.number;

  const bingoSections = [
    { letter: 'B', start: 1, end: 15, color: 'bg-blue-600' },
    { letter: 'I', start: 16, end: 30, color: 'bg-purple-600' },
    { letter: 'N', start: 31, end: 45, color: 'bg-red-600' },
    { letter: 'G', start: 46, end: 60, color: 'bg-teal-600' },
    { letter: 'O', start: 61, end: 75, color: 'bg-indigo-600' },
  ];

  return (
    <div className="flex flex-col gap-2 w-full h-full p-2 bg-black bg-opacity-20 rounded-lg">
      {bingoSections.map(section => (
        <div key={section.letter} className="flex items-center gap-3">
          {/* BINGO Letter Box - Increased size */}
          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-red-600 text-white font-bold text-3xl rounded">
            {section.letter}
          </div>
          {/* Numbers Row */}
          <div className="flex-grow grid gap-1.5" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
            {Array.from({ length: 15 }, (_, i) => section.start + i).map(num => {
              const isNumCalled = isCalled(num);
              const isNumLastCalled = isLastCalled(num);

              // MODIFIED: Increased font size to text-3xl for better visibility
              let cellClasses = 'aspect-square flex items-center justify-center rounded font-bold text-4xl transition-all duration-300 ';

              if (isNumLastCalled) {
                // Style for the most recently called number (bright orange highlight)
                cellClasses += 'bg-orange-500 text-white border-2 border-white scale-110 animate-pulse';
              } else if (isNumCalled) {
                // MODIFIED: Style for other called numbers now uses different colors per section
                cellClasses += `${section.color} text-white`;
              } else {
                // Style for uncalled numbers (dark cells)
                cellClasses += 'bg-gray-800 text-gray-400';
              }

              return (
                <div key={num} className={cellClasses}>
                  {num}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllNumbersGrid;