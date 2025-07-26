// MODIFIED: TicketSelectionPanel component
import React from 'react';

// Add betAmount to the props
function TicketSelectionPanel({ tickets, selectedTickets, onSelectTicket, onActivateTickets, betAmount, isActivateTicketsDisabled, activationWarningMessage, userCurrentBalance }) {
  // Ensure betAmount is treated as a number, defaulting to 10 if not valid or undefined
  const currentBetAmount = typeof betAmount === 'number' && !isNaN(betAmount) ? betAmount : 10;
  const totalCost = selectedTickets.length * currentBetAmount; // NEW: Calculate total cost

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="flex justify-between">
          <p className="mt-2 font-bold text-white">
            Select Tickets
          </p>
          {userCurrentBalance !== undefined && userCurrentBalance !== null && ( // NEW: Display user's current balance
              <span className="ml-4 text-sm font-normal text-white">
                  Your Balance: {userCurrentBalance.toFixed(2)} ETB
              </span>
          )}
        </div>
      </div>
      <div style={{ opacity: 1, display: 'block', transform: 'none' }}>
        <div className="flex h-[76vh] w-full flex-col justify-between">
          <div
            className="mt-2 flex h-[64vh] flex-wrap items-start justify-center gap-4 overflow-y-auto rounded-lg px-2 py-4"
            style={{ backgroundColor: 'rgba(228, 233, 242, 0.4)' }}
          >
            {tickets.map((ticketNumber) => (
              <div
                key={ticketNumber}
                className={`flex h-[50px] w-[71.2px] cursor-pointer items-center justify-center rounded-md border border-[#FFFFFF33] text-white ${
                  selectedTickets.includes(ticketNumber)
                    ? 'bg-white !text-slate-950'
                    : ''
                }`}
                onClick={() => onSelectTicket(ticketNumber)}
              >
                {ticketNumber}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-center">
            <div>
              <p className="text-center text-base font-semibold text-white mb-2">
                Total Tickets : {selectedTickets.length}{' '}
              </p>
              <button
                className="btn h-[52px] w-[284px] rounded-[3px] border-[#00000033] bg-[#00000033] px-5 py-1 font-semibold text-white"
                onClick={onActivateTickets}
                disabled={isActivateTicketsDisabled} // NEW: Apply disabled state from prop
              >
                Activate Tickets
                <span className="ml-1 text-dama-success">
                  {totalCost.toFixed(2)}ETB {/* Display total cost to activate */}
                </span>
              </button>
              {activationWarningMessage && ( // NEW: Display warning message if provided
                <p className="text-yellow-300 text-sm mt-2 text-center max-w-[284px]">
                  {activationWarningMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketSelectionPanel;