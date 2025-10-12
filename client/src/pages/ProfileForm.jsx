/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/userContext.jsx';
import config from '../config.js';
import Modal from '../components/Modal.jsx';
import { FaInstagram, FaDiscord, FaTwitter, FaUpload, FaEdit, FaTrash } from 'react-icons/fa';

// --- DATA SOURCES: Easily add more platforms here ---
const AVAILABLE_GAMES = [
    { key: 'codm', name: 'COD Mobile' },
    { key: 'valorant', name: 'Valorant' },
    { key: 'bgmi', name: 'BGMI' },
];

const AVAILABLE_SOCIALS = [
    { key: 'instagram', name: 'Instagram', icon: FaInstagram, placeholder: 'your_username' },
    { key: 'discord', name: 'Discord', icon: FaDiscord, placeholder: 'YourName#1234' },
    { key: 'twitter', name: 'Twitter', icon: FaTwitter, placeholder: 'YourHandle' },
];

const ProfileForm = () => {
    const navigate = useNavigate();
    const { session, userProfile } = useUser();

    // Form State
    const [uploading, setUploading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [gameIds, setGameIds] = useState({});
    const [socialLinks, setSocialLinks] = useState({});
    const [error, setError] = useState('');

    // Modal State
    const [isGameModalOpen, setGameModalOpen] = useState(false);
    const [currentGame, setCurrentGame] = useState(AVAILABLE_GAMES[0].key);
    const [gameIdInput, setGameIdInput] = useState('');

    const [isSocialModalOpen, setSocialModalOpen] = useState(false);
    const [currentSocial, setCurrentSocial] = useState(AVAILABLE_SOCIALS[0].key);
    const [socialHandleInput, setSocialHandleInput] = useState('');

    useEffect(() => {
        if (userProfile) {
            setIsEditMode(true);
            setUsername(userProfile.username || '');
            setFullName(userProfile.full_name || '');
            setPhotoUrl(userProfile.photo_url || '');
            setGameIds(userProfile.game_ids || {});
            setSocialLinks(userProfile.social_links || {});
        }
    }, [userProfile]);

    const handleAvatarUpload = async (event) => {
        try {
            setUploading(true);
            setError('');
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }
            const file = event.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            const token = session.access_token;
            const response = await fetch(`${config.apiBaseUrl}/users/profile/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'Failed to upload avatar.');
            }
            setPhotoUrl(data.photo_url + `?t=${new Date().getTime()}`);
        } catch (error) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };
    
    // --- Handlers for Adding, Editing, and Deleting ---

    const handleAddOrUpdateGameId = () => {
        if (!gameIdInput) return;
        setGameIds(prev => ({ ...prev, [currentGame]: gameIdInput }));
        setGameIdInput('');
        setGameModalOpen(false);
    };

    const handleEditGameId = (gameKey, id) => {
        setCurrentGame(gameKey);
        setGameIdInput(id);
        setGameModalOpen(true);
    };

    const handleDeleteGameId = (gameKey) => {
        setGameIds(prev => {
            const newGameIds = { ...prev };
            delete newGameIds[gameKey];
            return newGameIds;
        });
    };

    const handleAddOrUpdateSocialLink = () => {
        if (!socialHandleInput) return;
        setSocialLinks(prev => ({ ...prev, [currentSocial]: socialHandleInput }));
        setSocialHandleInput('');
        setSocialModalOpen(false);
    };

    const handleEditSocialLink = (socialKey, handle) => {
        setCurrentSocial(socialKey);
        setSocialHandleInput(handle);
        setSocialModalOpen(true);
    };

    const handleDeleteSocialLink = (socialKey) => {
        setSocialLinks(prev => {
            const newSocialLinks = { ...prev };
            delete newSocialLinks[socialKey];
            return newSocialLinks;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const cleanGameIds = Object.fromEntries(Object.entries(gameIds).filter(([_, value]) => value));
        const cleanSocialLinks = Object.fromEntries(Object.entries(socialLinks).filter(([_, value]) => value));
        const profileData = {
            username,
            full_name: fullName,
            photo_url: photoUrl,
            game_ids: cleanGameIds,
            social_links: cleanSocialLinks,
        };
        const token = session.access_token;
        const url = `${config.apiBaseUrl}/users/profile`;
        const method = isEditMode ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(profileData)
        });
        const data = await response.json();
        if (!response.ok) {
            setError(data.detail || `Failed to ${isEditMode ? 'update' : 'create'} profile.`);
        } else {
            navigate(`/users/${data.username}`);
            window.location.reload();
        }
    };

    return (
        <>
            <div className="bg-[#252b3b] p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-2xl border-2 border-[#FF5733] max-h-[90vh] overflow-y-auto">
                <h2 className="text-3xl font-bold text-center text-white mb-8">
                    {isEditMode ? 'Edit Your Profile' : 'Create Your Gamer Profile'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <img src={photoUrl || `https://api.dicebear.com/8.x/bottts/svg?seed=${username || 'new-user'}`} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[#FF5733] object-cover bg-gray-700" />
                        <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
                            <FaUpload />
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                        </label>
                        <input id="avatar-upload" type="file" accept="image/png, image/jpeg" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
                    </div>
                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-[#FF5733]" />
                    <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-[#FF5733]" />
                    
                    <div className="border-t border-gray-600 pt-6">
                        <h3 className="text-xl font-semibold text-white mb-3">Game IDs</h3>
                        <div className="flex flex-col gap-3 mb-4">
                            {Object.entries(gameIds).map(([game, id]) => (
                                <div key={game} className="bg-[#1a1f2e] p-2 rounded-lg flex justify-between items-center">
                                    <div>
                                        <span className="font-bold text-[#FF5733] uppercase">{game}: </span>
                                        <span className="text-gray-300 font-mono">{id}</span>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <button type="button" onClick={() => handleEditGameId(game, id)} className="text-gray-400 hover:text-white"><FaEdit /></button>
                                        <button type="button" onClick={() => handleDeleteGameId(game)} className="text-gray-400 hover:text-red-500"><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => { setGameIdInput(''); setGameModalOpen(true); }} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition">Add Game ID</button>
                    </div>
                    
                    <div className="border-t border-gray-600 pt-6">
                        <h3 className="text-xl font-semibold text-white mb-3">Social Links</h3>
                        <div className="flex flex-col gap-3 mb-4">
                            {Object.entries(socialLinks).map(([key, handle]) => {
                                const platform = AVAILABLE_SOCIALS.find(s => s.key === key);
                                if (!platform) return null;
                                const Icon = platform.icon;
                                return (
                                    <div key={key} className="bg-[#1a1f2e] p-2 rounded-lg flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-6 h-6 text-gray-300" />
                                            <span className="text-gray-300">{handle}</span>
                                        </div>
                                        <div className="flex gap-4 items-center">
                                            <button type="button" onClick={() => handleEditSocialLink(key, handle)} className="text-gray-400 hover:text-white"><FaEdit /></button>
                                            <button type="button" onClick={() => handleDeleteSocialLink(key)} className="text-gray-400 hover:text-red-500"><FaTrash /></button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <button type="button" onClick={() => { setSocialHandleInput(''); setSocialModalOpen(true); }} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition">Add Social Link</button>
                    </div>

                    <button type="submit" className="w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition duration-300 mt-6" disabled={uploading}>
                        {isEditMode ? 'Save Changes' : 'Create Profile'}
                    </button>
                </form>
                {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            </div>

            <Modal isOpen={isGameModalOpen} onClose={() => setGameModalOpen(false)}>
                <h3 className="text-2xl font-bold mb-4 text-center">Add/Edit Game ID</h3>
                <select value={currentGame} onChange={(e) => setCurrentGame(e.target.value)} className="w-full mb-4 px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg">
                    {AVAILABLE_GAMES.map(game => (
                        <option key={game.key} value={game.key}>{game.name}</option>
                    ))}
                </select>
                <input type="text" placeholder="Enter your in-game ID" value={gameIdInput} onChange={(e) => setGameIdInput(e.target.value)} className="w-full mb-4 px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]" />
                <button onClick={handleAddOrUpdateGameId} className="w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600">Save</button>
            </Modal>

            <Modal isOpen={isSocialModalOpen} onClose={() => setSocialModalOpen(false)}>
                <h3 className="text-2xl font-bold mb-4 text-center">Add/Edit Social Link</h3>
                <select value={currentSocial} onChange={(e) => setCurrentSocial(e.target.value)} className="w-full mb-4 px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg">
                    {AVAILABLE_SOCIALS.map(social => (
                        <option key={social.key} value={social.key}>{social.name}</option>
                    ))}
                </select>
                <input type="text" placeholder="Enter your handle or ID" value={socialHandleInput} onChange={(e) => setSocialHandleInput(e.target.value)} className="w-full mb-4 px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]" />
                <button onClick={handleAddOrUpdateSocialLink} className="w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600">Save</button>
            </Modal>
        </>
    );
};

export default ProfileForm;