// src/components/FloatingBottomNav.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaUser, FaTrophy, FaPlusCircle } from 'react-icons/fa'; // Assuming FaHome for Dashboard
import { useUser } from '../context/userContext.jsx';
import PlusMenu from './PlusMenu.jsx';

const FloatingBottomNav = () => {
    const { userProfile } = useUser();
    const [isMenuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e] border-t border-gray-700 p-3 shadow-lg z-40"> {/* Hide on medium screens and up */}
                <div className="max-w-md mx-auto flex justify-around items-center text-gray-400">
                    <Link to="/" className="flex flex-col items-center hover:text-white transition">
                        <FaHome size={22} />
                        <span className="text-xs mt-1">Home</span>
                    </Link>

                    <Link to="/tournaments" className="flex flex-col items-center hover:text-white transition">
                        <FaTrophy size={22} />
                        <span className="text-xs mt-1">Tournaments</span>
                    </Link>

                    <button onClick={() => setMenuOpen(!isMenuOpen)} className="text-[#FF5733] transform hover:scale-110 transition">
                        <FaPlusCircle size={36} />
                    </button>

                    <Link
                        to={userProfile ? `/users/${userProfile.username}` : '/'}
                        className={`flex flex-col items-center transition ${userProfile ? 'hover:text-white' : 'opacity-50 cursor-not-allowed'}`}
                        onClick={(e) => !userProfile && e.preventDefault()}
                    >
                        <FaUser size={22} />
                        <span className="text-xs mt-1">Me</span>
                    </Link>

                    {/* Placeholder for future chat/notifications */}
                    <button className="flex flex-col items-center hover:text-white transition opacity-50 cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        <span className="text-xs mt-1">Chat</span>
                    </button>
                </div>
            </div>
            {/* Render PlusMenu conditionally */}
            <PlusMenu isOpen={isMenuOpen} onClose={() => setMenuOpen(false)} />
        </>
    );
};

export default FloatingBottomNav;