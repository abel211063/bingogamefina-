import React, { useRef, useEffect, useState } from 'react';
// Remove direct axios import as it will come from props now (via App.jsx -> apiService)
// import axios from 'axios'; 

function CheckClaimModal({ isOpen, onClose, gameId, verifyBet }) { // Added verifyBet prop
  const modalRef = useRef(null);
  const [ticketNumber, setTicketNumber] = useState('');
  const [claimResult, setClaimResult] = useState(null); // { isValid: boolean, message: string }
  const [isChecking, setIsChecking] = useState(false); // To prevent multiple submissions

  // Effect to open/close the modal via native dialog API
  useEffect(() => {
    if (modalRef.current) {
      if (isOpen) {
        modalRef.current.showModal();
        // Reset state when modal opens
        setTicketNumber('');
        setClaimResult(null);
        setIsChecking(false);
      } else {
        modalRef.current.close();
      }
    }
  }, [isOpen]);

  // Effect to handle closing modal by Escape key or backdrop click
  useEffect(() => {
    const dialogElement = modalRef.current;
    if (dialogElement) {
      const handleCancel = () => {
        onClose();
      };
      dialogElement.addEventListener('cancel', handleCancel);

      const handleClickOutside = (event) => {
        if (event.target === dialogElement) {
          onClose();
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
    if (!ticketNumber || !gameId) {
      setClaimResult({ isValid: false, message: 'Please enter a ticket number and ensure a game is active.' });
      return;
    }
    // DUMMY: sequence_index is a placeholder for frontend, assuming 11 calls for a win
    const dummySequenceIndex = 11; 

    setIsChecking(true);
    setClaimResult(null); // Clear previous results

    try {
      // Use the verifyBet prop (which comes from apiService)
      const response = await verifyBet(gameId, ticketNumber, dummySequenceIndex); 

      setClaimResult(response.data);
    } catch (error) {
      console.error('Error checking claim:', error.response?.data?.message || error.message);
      setClaimResult({ isValid: false, message: error.response?.data?.message || 'Failed to check claim.' });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <dialog id="check_claim_modal" className="modal" ref={modalRef}>
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
                        {/* Static BINGO letters for card visual, not dynamic */}
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
                      {/* Placeholder for Card display area. Real implementation would fetch and show the card. */}
                      <div className="mt-2 text-center text-gray-300">
                        {/* Visual representation of the card numbers would go here based on ticketNumber */}
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
              <div className="w-[70%] rounded-[18px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-10 text-center flex items-center justify-center"> {/* Added flex and align-items for centering */}
                {claimResult ? (
                  <div className={`text-xl font-semibold ${claimResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    <p>{claimResult.message}</p>
                    {claimResult.isValid && <p>Ticket #{claimResult.slipId} is a winner!</p>}
                    {!claimResult.isValid && <p>Please check the ticket number or game status.</p>}
                  </div>
                ) : (
                  <h1 className="text-base font-semibold !text-white">
                    Enter Ticket Number and Check Claim to See Results.
                  </h1>
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