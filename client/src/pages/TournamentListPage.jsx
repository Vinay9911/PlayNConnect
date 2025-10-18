// src/pages/TournamentsListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import config from '../config.js';
import pNcLogo from '../assets/playnconnect_logo.png'; // Default image

const TournamentsListPage = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTournaments = async () => {
            setLoading(true);
            setError('');
            try {
                // This endpoint is public, no auth needed
                const response = await fetch(`${config.apiBaseUrl}/tournaments`);
                if (!response.ok) {
                    throw new Error('Failed to fetch tournaments.');
                }
                const data = await response.json();
                setTournaments(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, []);

    if (loading) return <div className="text-white text-center p-10">Loading Tournaments...</div>;
    if (error) return <div className="text-red-500 text-center p-10">{error}</div>;

    return (
        <div className="w-full max-w-6xl p-2">
            <h1 className="text-3xl font-bold text-center text-white mb-8">Available Tournaments</h1>
            {tournaments.length === 0 ? (
                <p className="text-center text-gray-400">No tournaments available right now. Check back later!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map((tournament) => (
                        <div key={tournament.id} className="bg-[#252b3b] rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col">
                            <img
                                src={tournament.image_url || pNcLogo}
                                alt={`${tournament.name} banner`}
                                className="w-full h-40 object-cover bg-gray-700"
                            />
                            <div className="p-4 flex flex-col flex-grow">
                                <h2 className="text-xl font-bold text-white mb-2">{tournament.name}</h2>
                                <p className="text-sm text-[#FF5733] font-semibold mb-1">{tournament.game}</p>
                                <p className="text-sm text-gray-400 mb-3">
                                    Starts: {new Date(tournament.start_date).toLocaleDateString()} | {tournament.max_teams} Teams
                                </p>
                                <p className="text-gray-300 text-sm mb-4 flex-grow line-clamp-2">
                                    {tournament.description || 'No description available.'}
                                </p>
                                <div className="mt-auto flex gap-3">
                                    <Link
                                        to={`/tournaments/${tournament.slug}`}
                                        className="flex-1 bg-gray-600 text-white text-center font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition"
                                    >
                                        View Details
                                    </Link>
                                    <Link
                                        to={`/tournaments/${tournament.slug}/register`}
                                        className="flex-1 bg-green-600 text-white text-center font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition"
                                    >
                                        Register
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TournamentsListPage;