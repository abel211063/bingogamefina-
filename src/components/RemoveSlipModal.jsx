import React, { useRef, useEffect } from 'react';

function RemoveSlipModal({ isOpen, onClose, onConfirm, slipId }) {
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
    <dialog id="remove_slip_modal" className="modal" ref={modalRef}>
      <div className="modal-box flex flex-col justify-between border-2 border-white bg-[#813535] py-5">
        <div className="flex h-[66px] items-center justify-between rounded-[10px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-2">
          <h1 className="text-lg font-bold uppercase text-white">
            Remove Slip?
          </h1>
          {/* Close button using DaisyUI classes */}
          <button
            className="btn btn-sm btn-circle btn-ghost text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="mt-2 rounded-[10px] border border-[#FFFFFF33] bg-[#FFFFFF33] px-2 py-4">
          <p className="text-xl font-semibold text-white">
            You’re Removing Ticket #{slipId || 'N/A'}
          </p>
          <p className="text-lg font-semibold text-white">
            Are you sure you want to remove this Ticket?
          </p>
        </div>
        <div>
          <button
            className="btn m-4 h-14 w-[181px] border border-white bg-transparent text-white"
            onClick={onClose} // Just closes the modal
          >
            Cancel
          </button>
          <button className="btn m-4 h-14 w-[181px] bg-[#00000033] text-white" onClick={onConfirm}>
            Yes
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default RemoveSlipModal;