import React, { useRef, useEffect } from 'react';

// Added onConfirmLogout prop
function LogoutModal({ isOpen, onClose, onConfirmLogout }) {
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
        // This only closes the modal, not logs out
        onClose();
      };
      dialogElement.addEventListener('cancel', handleCancel);

      const handleClickOutside = (event) => {
        if (event.target === dialogElement) {
          // This only closes the modal, not logs out
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

  // This function is now only called when 'Yes' is clicked
  const handleConfirm = () => {
    onConfirmLogout(); // Call the actual logout logic passed from App.jsx
    onClose(); // Then close the modal
  };

  return (
    // Unique ID for this modal
    <dialog id="logout_modal" className="modal" ref={modalRef}>
      <div className="modal-box flex flex-col justify-between border-2 border-white bg-[#813535] py-5">
        <div className="flex h-[66px] items-center justify-between rounded-[10px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-2">
          <h1 className="text-lg font-bold uppercase text-white">
            Log out?
          </h1>
          {/* Close button using DaisyUI classes */}
          <button
            className="btn btn-sm btn-circle btn-ghost text-white"
            onClick={onClose} // This button only closes the modal
          >
            ✕
          </button>
        </div>
        <div className="mt-2 rounded-[10px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-2 py-4">
          <p className="text-xl font-semibold text-white">
            You’ve a game which is in progress!!!
          </p>
          <p className="text-lg font-semibold text-white">
            Are you sure you want to logout?
          </p>
        </div>
        <div>
          <button
            className="btn m-4 h-14 w-[181px] border-2 border-white bg-transparent text-white hover:bg-transparent"
            onClick={onClose} // This button only closes the modal
          >
            Cancel
          </button>
          <button className="btn m-4 h-14 w-[181px] bg-[#00000033] text-white" onClick={handleConfirm}>
            Yes
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default LogoutModal;