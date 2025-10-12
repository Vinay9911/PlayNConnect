import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Backdrop with corrected blur and opacity for better visual effect
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-[#252b3b] p-8 rounded-2xl shadow-xl w-full max-w-md border-2 border-[#FF5733] text-white relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition text-2xl leading-none"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;

