// src/components/Accordion.jsx

import React from 'react';
import { FaChevronDown, FaCheckCircle } from 'react-icons/fa';

const Accordion = ({ title, isOpen, isCompleted, onToggle, children }) => {
    return (
        <div className="border border-gray-700 rounded-lg mb-4">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 bg-[#1a1f2e] hover:bg-gray-800 transition"
            >
                <div className="flex items-center">
                    {isCompleted ? (
                        <FaCheckCircle className="text-green-500 mr-3" />
                    ) : (
                        <div className={`w-5 h-5 rounded-full mr-3 ${isOpen ? 'bg-[#FF5733]' : 'bg-gray-600'}`} />
                    )}
                    <span className="font-semibold text-lg">{title}</span>
                </div>
                <FaChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 bg-[#252b3b] border-t border-gray-700">
                    {children}
                </div>
            )}
        </div>
    );
};

export default Accordion;