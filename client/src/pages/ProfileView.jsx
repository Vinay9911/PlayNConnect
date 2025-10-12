// src/pages/ProfileView.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/userContext.jsx';
import config from '../config.js';
import Modal from '../components/Modal.jsx';
import pNcLogo from '../assets/playnconnect_logo.png';
import { FaInstagram, FaDiscord, FaTwitter, FaCopy, FaCheck } from 'react-icons/fa';

// --- DATA SOURCE: Defines how to display social links ---
// To add a new one, just add an entry here. E.g., 'twitch': { icon: FaTwitch, url: 'https://twitch.tv/' }
const SOCIAL_PLATFORMS = {
    instagram: { icon: FaInstagram, url: 'https://instagram.com/' },
    discord: { icon: FaDiscord, url: null }, // Discord doesn't have profile URLs, just shows the tag
    twitter: { icon: FaTwitter, url: 'https://twitter.com/' },
};

const ProfileView = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { session, userProfile } = useUser();

    const [viewedProfile, setViewedProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedId, setCopiedId] = useState(null); // State to track which ID was copied

    useEffect(() => {
        const fetchProfile = async () => {
            if (userProfile && userProfile.username === username) {
                setViewedProfile(userProfile);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const response = await fetch(`${config.apiBaseUrl}/users/profile/${username}`);
                if (!response.ok) {
                    throw new Error((await response.json()).detail || 'Profile not found.');
                }
                setViewedProfile(await response.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username, userProfile]);

    const handleCopy = (text, gameKey) => {
        navigator.clipboard.writeText(text);
        setCopiedId(gameKey); // Set which game ID was copied
        setTimeout(() => {
            setCopiedId(null); // Reset after 2 seconds
        }, 2000);
    };

    const isOwner = session && userProfile && userProfile.id === viewedProfile?.id;

    if (loading) return <div className="text-white text-center">Loading Gamer Profile...</div>;

    if (error || !viewedProfile) {
        return (
            <Modal isOpen={true} onClose={() => navigate('/')}>
                <div className="text-center">
                    <img src={pNcLogo} alt="User not found" className="w-20 h-20 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">The user is MIA, soldier.</h2>
                    <p className="text-[#9ca3af] mb-6">{error || "This profile could not be found."}</p>
                    <button onClick={() => navigate('/')} className="w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition">Return to Home</button>
                </div>
            </Modal>
        );
    }

    const gameIdsArray = Object.entries(viewedProfile.game_ids || {});
    const socialLinksArray = Object.entries(viewedProfile.social_links || {});

    return (
        <div className="bg-[#252b3b] p-8 rounded-2xl shadow-xl w-full max-w-md border-2 border-[#FF5733] text-white">
            {isOwner && (
                <div className="absolute top-4 right-4">
                    <Link to="/profile/edit" className="bg-[#FF5733] text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition text-sm">
                        Edit Profile
                    </Link>
                </div>
            )}
            <div className="flex flex-col items-center text-center">
                <img src={viewedProfile.photo_url || pNcLogo} alt={`${viewedProfile.username}'s avatar`} className="w-28 h-28 rounded-full border-4 border-[#FF5733] mb-4 bg-gray-700 object-cover" />
                <h1 className="text-4xl font-bold">{viewedProfile.username}</h1>
                <p className="text-lg text-[#9ca3af]">{viewedProfile.full_name}</p>

                {/* Social Links - Rendered Dynamically */}
                <div className="flex items-center gap-5 mt-4">
                    {socialLinksArray.map(([key, handle]) => {
                        const platform = SOCIAL_PLATFORMS[key];
                        if (!platform) return null;
                        const Icon = platform.icon;
                        const url = platform.url ? `${platform.url}${handle}` : '#';

                        return (
                            <a key={key} href={url} target={platform.url ? "_blank" : "_self"} rel="noopener noreferrer" title={`${platform.name}: ${handle}`}>
                                <Icon className="w-7 h-7 text-gray-400 hover:text-white transition-colors" />
                            </a>
                        );
                    })}
                </div>
            </div>
            
            {/* Game IDs Section - With Copy Button */}
            {gameIdsArray.length > 0 && (
                <div className="border-t border-gray-600 mt-8 pt-6">
                    <h3 className="text-xl font-semibold text-white mb-4 text-center">Game IDs</h3>
                    <div className="flex flex-col items-center gap-3">
                        {gameIdsArray.map(([game, id]) => (
                            <div key={game} className="bg-[#1a1f2e] py-2 px-4 rounded-lg text-base w-full max-w-xs flex justify-between items-center">
                                <div>
                                    <span className="font-bold text-[#FF5733] uppercase">{game}: </span>
                                    <span className="text-gray-300 font-mono">{id}</span>
                                </div>
                                <button onClick={() => handleCopy(id, game)} className="text-gray-400 hover:text-white transition-colors">
                                    {copiedId === game ? <FaCheck className="text-green-500" /> : <FaCopy />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileView;