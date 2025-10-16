import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import config from '../config.js';
import { useUser } from '../context/userContext.jsx';
import { FaCheckCircle, FaPlusCircle } from 'react-icons/fa';
import pNcLogo from '../assets/playnconnect_logo.png';


const UserSearchModal = ({ isOpen, onClose, onAddMembers, existingMembers, maxMembers }) => {
    const { session } = useUser();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (query.length < 3) {
            setResults([]);
            return;
        }

        const search = async () => {
            try {
                const token = session.access_token;
                const response = await fetch(`${config.apiBaseUrl}/users/search/${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Search failed.');
                const data = await response.json();
                // Exclude users who are already in the team
                const newResults = data.filter(user => !existingMembers.some(em => em.id === user.id));
                setResults(newResults);
            } catch (err) {
                setError(err.message);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [query, session, existingMembers]);

    const toggleSelection = (user) => {
        if (selectedUsers.some(su => su.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(su => su.id !== user.id));
        } else {
            if ((existingMembers.length + selectedUsers.length) < maxMembers) {
                setSelectedUsers([...selectedUsers, user]);
            } else {
                alert(`You can only add up to ${maxMembers - existingMembers.length} more members.`);
            }
        }
    };

    const handleConfirm = () => {
        onAddMembers(selectedUsers);
        onClose();
        setQuery('');
        setSelectedUsers([]);
    };
    
    // Combine selected users with the rest, ensuring selected are on top
    const sortedResults = [...results].sort((a, b) => {
        const aIsSelected = selectedUsers.some(su => su.id === a.id);
        const bIsSelected = selectedUsers.some(su => su.id === b.id);
        return bIsSelected - aIsSelected;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h3 className="text-2xl font-bold mb-4 text-center">Add Teammates</h3>
            <input
                type="text"
                placeholder="Search by username (min 3 chars)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full mb-4 px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg"
            />
            <div className="max-h-60 overflow-y-auto mb-4">
                {sortedResults.map(user => {
                    const isSelected = selectedUsers.some(su => su.id === user.id);
                    return (
                        <div key={user.id} onClick={() => toggleSelection(user)} className="flex items-center p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                            <img src={user.photo_url || pNcLogo} alt={user.username} className="w-10 h-10 rounded-full mr-4"/>
                            <span className="font-semibold">{user.username}</span>
                            {isSelected ? (
                                <FaCheckCircle className="ml-auto text-green-500" />
                            ) : (
                                <FaPlusCircle className="ml-auto text-gray-400" />
                            )}
                        </div>
                    );
                })}
            </div>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <button onClick={handleConfirm} className="w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600">
                Add {selectedUsers.length} Member(s)
            </button>
        </Modal>
    );
};

export default UserSearchModal;