import React, { useRef, useEffect } from 'react';

function CallHistoryModal({ isOpen, onClose }) {
  const modalRef = useRef(null);

  // Effect to open/close the modal via native dialog API
  useEffect(() => {
    if (modalRef.current) {
      if (isOpen) {
        modalRef.current.showModal();
      } else {
        modalRef.current.close();
      }
    }
  }, [isOpen]);

  // Effect to handle closing modal by Escape key or backdrop click
  useEffect(() => {
    const dialogElement = modalRef.current;
    if (dialogElement) {
      const handleCancel = (event) => {
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

  return (
    // Unique ID for this modal
    <dialog id="call_history_modal" className="modal" ref={modalRef}>
      <div className="modal-box z-50 rounded-lg border border-white bg-[#772005]">
        <div className="min-h-[20vh] min-w-[45vw] p-1">
          <div>
            <div className="mx-4 my-4 flex items-center justify-between rounded-[10px] border border-[#FFFFFF33] px-2 py-4">
              <div>
                <h1 className="text-lg font-bold text-white">
                  Call History - GAME #
                </h1>
                <p className="mt-2 text-lg font-normal text-white">
                  Checkout the previous calls from the most recent to
                  oldest, left to right
                </p>
              </div>
              {/* Close button using DaisyUI classes */}
              <button
                className="btn btn-sm btn-circle btn-ghost text-white"
                onClick={onClose}
              >
                ✕
              </button>
            </div>
            <div className="px-4">
              <div className="flex h-10 w-full items-center justify-between bg-transparent">
                {['B', 'I', 'N', 'G', 'O'].map((letter) => (
                  <div
                    key={letter}
                    className="flex w-full items-center justify-center"
                  >
                    <p>{letter}</p>
                  </div>
                ))}
              </div>
              <div className="flex h-[58vh] w-full items-start justify-between overflow-y-auto">
                {/* Placeholder for B, I, N, G, O columns content */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex w-full items-center justify-center"
                  >
                    <div className="flex w-full flex-col items-center justify-center"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default CallHistoryModal;