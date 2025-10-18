// src/components/UserList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/userContext.jsx';
import pNcLogo from '../assets/playnconnect_logo.png';

const UserList = () => {
    const { userProfile } = useUser(); // Get current user's profile

    return (
        <div className="bg-[#252b3b] p-4 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Users</h2>
            {userProfile ? (
                 <Link to={`/users/${userProfile.username}`} className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition">
                    <img
                        src={userProfile.photo_url || pNcLogo}
                        alt={userProfile.username}
                        className="w-10 h-10 rounded-full mr-3 border-2 border-[#FF5733]"
                    />
                    <span className="font-medium text-white">{userProfile.username}</span>
                    <span className="ml-auto text-xs text-green-400">(You)</span>
                </Link>
            ) : (
                <p className="text-gray-400">Loading user...</p>
            )}
            {/* Placeholder for future user/friend list */}
            {/* <div className="mt-4 text-center text-gray-500 text-sm">
                More users coming soon...
            </div> */}
        </div>
    );
};

export default UserList;