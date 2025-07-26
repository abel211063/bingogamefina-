// --- START OF FILE CheckClaimModal.jsx ---

import React, { useRef, useEffect, useState } from 'react';
import Confetti from 'react-confetti';

function CheckClaimModal({ isOpen, onClose, gameId, verifyBet }) {
  const modalRef = useRef(null);
  const [ticketNumber, setTicketNumber] = useState('');
  // MODIFIED: Initialize claimResult with a default, non-null message object
  const [claimResult, setClaimResult] = useState({ isValid: false, message: 'Enter Ticket Number and Check Claim to See Results.' });
  const [isChecking, setIsChecking] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (modalRef.current) {
      if (isOpen) {
        modalRef.current.showModal();
        setTicketNumber('');
        // MODIFIED: Reset to the default message object when the modal opens
        setClaimResult({ isValid: false, message: 'Enter Ticket Number and Check Claim to See Results.' });
        setShowConfetti(false);
        setIsChecking(false);
      } else {
        modalRef.current.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialogElement = modalRef.current;
    if (dialogElement) {
      const handleCancel = () => {
        onClose();
        setShowConfetti(false);
      };
      dialogElement.addEventListener('cancel', handleCancel);

      const handleClickOutside = (event) => {
        if (event.target === dialogElement) {
          onClose();
          setShowConfetti(false);
        }
      };
      dialogElement.addEventListener('click', handleClickOutside);

      return () => {
        dialogElement.removeEventListener('cancel', handleCancel);
        dialogElement.removeEventListener('click', handleClickOutside);
      };
    }
  }, [onClose]);

  const handleCheckClaim = async (e) => {
    e.preventDefault();
    setShowConfetti(false);
    if (!ticketNumber || !gameId) {
      setClaimResult({ isValid: false, message: 'Please enter a ticket number and ensure a game is active.' });
      return;
    }

    const dummySequenceIndex = 11; // Frontend still sends this, but backend uses pattern check

    setIsChecking(true);

    try {
      // MODIFIED: No longer access .data, as handleVerifyBet in App.jsx already returns the data directly.
      const response = await verifyBet(gameId, ticketNumber); // No dummy sequence index needed
       setClaimResult(response); // handleVerifyBet in App.jsx now returns the data directly
           // --- NEW LOGIC: Trigger confetti if the claim is valid ---
      if (response.isValid) {
       setShowConfetti(true);
       // Optional: Turn off confetti after a few seconds
       setTimeout(() => {
         setShowConfetti(false);
        }, 6000); // Confetti lasts for 8 seconds
      }
     // --- END NEW LOGIC ---

    } catch (error) {
      console.error('Error checking claim:', error.response?.data?.message || error.message);
      // For any API error, display the error message from the response if available, otherwise a generic one.
      setClaimResult({ isValid: false, message: error.response?.data?.message || 'Failed to check claim due to unexpected error.' });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <dialog id="check_claim_modal" className="modal" ref={modalRef}>
      {showConfetti && <Confetti />}
      <div className="modal-box w-[62vw] rounded-lg bg-[#813535] px-3">
        <div className="mt-4 flex h-[66px] items-center justify-between rounded-[10px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-2">
          <h1 className="text-lg font-bold uppercase text-white">
            Check Claim
          </h1>
          <button
            className="btn btn-sm btn-circle btn-ghost text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="min-h-[20vh] p-1">
          <div>
            <div className="flex gap-x-4 py-4">
              <div className="flex min-h-[55vh] w-[28%] flex-col justify-between rounded-[18px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-3">
                <form className="flex h-full flex-col justify-between pb-2" onSubmit={handleCheckClaim}>
                  <div>
                    <h1 className="mb-2 mt-8 text-base font-semibold text-white">
                      Ticket Number
                    </h1>
                    <input
                      maxLength="255"
                      placeholder="Enter Your bingo Card id Here"
                      className="input h-[50px] w-full rounded-[4px] border border-[#FFFFFF33] bg-white p-1 pl-4 lowercase text-black placeholder:text-black autofill:text-black autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
                      type="number"
                      value={ticketNumber}
                      onChange={(e) => setTicketNumber(e.target.value)}
                      required
                    />
                    <div>
                      <div className="mt-4 flex gap-x-2">
                        {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                          <div
                            key={letter}
                            className="flex h-[46.5px] w-[84.4px] items-center justify-center rounded-[8px] bg-transparent"
                          >
                            <p className="text-[22px] font-semibold text-white">
                              {letter}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-center text-gray-300">
                        <p>Card will display here.</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div>
                      <div className="flex items-center justify-center gap-x-4">
                        <button
                          type="submit"
                          className="btn h-14 w-full rounded-[8px] border-[1px] border-[#00000033] bg-[#00000033] px-5 py-1 text-white"
                          disabled={isChecking}
                        >
                          {isChecking ? 'Checking...' : 'Check Claim'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="w-[70%] rounded-[18px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-10 text-center flex items-center justify-center">
                {isChecking ? (
                  <h1 className="text-xl font-semibold text-white">Checking claim...</h1>
                ) : (
                  // MODIFIED: Simplified rendering - claimResult is now always an object
                 <div className={`text-xl font-semibold ${claimResult?.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {/* Always display the message from the backend or the initial message */}
                    <p className=' text-white'>{claimResult.message}</p>
                    {/* Display winning amount only if isValid is true and winningAmount is provided */}
                    {claimResult.isValid && typeof claimResult.winningAmount === 'number' && (
                      <p className="text-2xl mt-2">You Win: {claimResult.winningAmount.toFixed(2)} ETB!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default CheckClaimModal;
// --- END OF FILE CheckClaimModal.jsx ---