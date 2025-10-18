// src/components/Navbar.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaSignOutAlt, FaUserCircle, FaTrophy } from 'react-icons/fa';
import pNcLogo from '../assets/playnconnect_logo.png';
import { useUser } from '../context/userContext.jsx';
import config from '../config.js'; // Make sure config is imported

// Debounce function
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

const Navbar = () => {
    const { session, handleLogout } = useUser();
    const [query, setQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [tournamentResults, setTournamentResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false); // To control dropdown visibility

    // Function to perform the search
    const performSearch = async (currentQuery) => {
        if (currentQuery.length < 3) {
            setUserResults([]);
            setTournamentResults([]);
            setShowResults(false);
            setLoading(false);
            return;
        }

        setLoading(true);
        setShowResults(true); // Show dropdown when searching
        try {
            const token = session?.access_token; // User search needs token
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            // --- Concurrent API Calls using Promise.all ---
            const [userResponse, tournamentResponse] = await Promise.all([
                // User Search (requires auth)
                token ? fetch(`${config.apiBaseUrl}/users/search/${currentQuery}`, { headers }) : Promise.resolve(null), // Only fetch if logged in
                // Tournament Search (public)
                fetch(`${config.apiBaseUrl}/tournaments/search/${currentQuery}`)
            ]);

            // Process User Results
            if (userResponse?.ok) {
                const users = await userResponse.json();
                setUserResults(users);
            } else if (token && userResponse?.status !== 401) { // Ignore 401 errors if not logged in
                console.error('User search failed:', userResponse?.statusText);
                setUserResults([]); // Clear on error
            } else {
                 setUserResults([]); // Clear if not logged in
            }


            // Process Tournament Results
            if (tournamentResponse.ok) {
                const tournaments = await tournamentResponse.json();
                setTournamentResults(tournaments);
            } else {
                console.error('Tournament search failed:', tournamentResponse.statusText);
                setTournamentResults([]); // Clear on error
            }

        } catch (error) {
            console.error('Search error:', error);
            setUserResults([]);
            setTournamentResults([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Debounced Search ---
    // Use useCallback to memoize the debounced function
    const debouncedSearch = useCallback(debounce(performSearch, 500), []); // Recreate if session changes

    // Trigger search on query change
    useEffect(() => {
        debouncedSearch(query);
    }, [query, debouncedSearch]); // Depend on query and the debounced function

    // Handle input change
    const handleInputChange = (event) => {
        setQuery(event.target.value);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if the click is outside the search input and results dropdown
            if (!event.target.closest('.search-container')) {
                 setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
        <nav className="fixed top-0 left-0 right-0 bg-[#1a1f2e] border-b border-gray-700 p-4 shadow-md z-40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-2">
                    <img src={pNcLogo} alt="PlayNConnect Logo" className="h-10 w-10" />
                    <span className="text-white text-xl font-bold hidden md:block">PlayNConnect</span>
                </Link>

                {/* --- Search Bar & Results Dropdown --- */}
                <div className="relative flex-1 max-w-lg mx-4 search-container"> {/* Increased max-w and added container class */}
                    <input
                        type="text"
                        placeholder="Search tournaments, users..."
                        className="w-full px-4 py-2 pl-10 bg-[#252b3b] text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF5733]"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => query.length >= 3 && setShowResults(true)} // Show results on focus if query is long enough
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

                    {/* --- Results Dropdown --- */}
                    {showResults && (query.length >= 3) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#252b3b] border border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
                            {loading && <div className="p-3 text-gray-400">Searching...</div>}
                            {!loading && userResults.length === 0 && tournamentResults.length === 0 && (
                                <div className="p-3 text-gray-400">No results found.</div>
                            )}

                            {/* User Results */}
                            {!loading && userResults.length > 0 && (
                                <>
                                    <h3 className="text-xs font-semibold uppercase text-gray-500 px-3 pt-3">Users</h3>
                                    {userResults.map(user => (
                                        <Link
                                            key={user.id}
                                            to={`/users/${user.username}`}
                                            onClick={() => { setQuery(''); setShowResults(false); }} // Clear search on click
                                            className="flex items-center p-3 hover:bg-gray-700 transition"
                                        >
                                            <img src={user.photo_url || pNcLogo} alt={user.username} className="w-8 h-8 rounded-full mr-3"/>
                                            <span className="text-white">{user.username}</span>
                                        </Link>
                                    ))}
                                </>
                            )}

                            {/* Tournament Results */}
                            {!loading && tournamentResults.length > 0 && (
                                <>
                                    {userResults.length > 0 && <hr className="border-gray-600 my-1"/>} {/* Separator */}
                                    <h3 className="text-xs font-semibold uppercase text-gray-500 px-3 pt-2">Tournaments</h3>
                                    {tournamentResults.map(tournament => (
                                        <Link
                                            key={tournament.id}
                                            to={`/tournaments/${tournament.slug}`}
                                            onClick={() => { setQuery(''); setShowResults(false); }} // Clear search on click
                                            className="flex items-center p-3 hover:bg-gray-700 transition"
                                        >
                                             <img src={tournament.image_url || pNcLogo} alt={tournament.name} className="w-8 h-8 rounded mr-3 object-cover"/>
                                            <div>
                                                 <span className="text-white block">{tournament.name}</span>
                                                 <span className="text-xs text-gray-400 block">{tournament.game}</span>
                                            </div>

                                        </Link>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition text-sm whitespace-nowrap flex items-center gap-2"
                    title="Logout"
                >
                    <FaSignOutAlt />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;