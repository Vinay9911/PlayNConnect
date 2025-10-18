// src/components/PlusMenu.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlusSquare, FaUserEdit, FaClipboardList } from 'react-icons/fa';

const PlusMenu = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        // Backdrop
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={onClose}
        >
            {/* Menu Content */}
            <div
                className="bg-[#252b3b] p-6 rounded-t-2xl shadow-xl w-full max-w-md border-t-2 border-[#FF5733] text-white"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <h3 className="text-xl font-bold text-center mb-6">Create or Join</h3>
                <div className="space-y-4">
                    <Link
                        to="/tournaments/create"
                        onClick={onClose}
                        className="flex items-center p-3 bg-[#1a1f2e] rounded-lg hover:bg-gray-700 transition"
                    >
                        <FaPlusSquare className="text-[#FF5733] mr-4" size={20} />
                        <span>Add a Tournament</span>
                    </Link>
                    <Link
                        to="/profile/edit"
                        onClick={onClose}
                        className="flex items-center p-3 bg-[#1a1f2e] rounded-lg hover:bg-gray-700 transition"
                    >
                        <FaUserEdit className="text-[#FF5733] mr-4" size={20} />
                        <span>Edit Your Profile</span>
                    </Link>
                    <Link
                        to="/tournaments" // Link to the list page
                        onClick={onClose}
                        className="flex items-center p-3 bg-[#1a1f2e] rounded-lg hover:bg-gray-700 transition"
                    >
                        <FaClipboardList className="text-[#FF5733] mr-4" size={20} />
                        <span>Register in a Tournament</span>
                    </Link>
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-6 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default PlusMenu;