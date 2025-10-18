// src/components/MyTournamentsList.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const MyTournamentsList = ({ tournaments, loading, error }) => {
    return (
        <div className="bg-[#252b3b] p-4 rounded-lg shadow-lg border border-gray-700 h-full"> {/* Added h-full */}
            <h2 className="text-xl font-semibold text-white mb-4">My Tournaments</h2>
            {loading && <p className="text-gray-400">Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && tournaments.length === 0 && (
                <p className="text-gray-400">You haven't created any tournaments yet.</p>
            )}
            {!loading && !error && tournaments.length > 0 && (
                <ul className="space-y-2 max-h-48 overflow-y-auto"> {/* Added max height and scroll */}
                    {tournaments.map((tournament) => (
                        <li key={tournament.id}>
                            <Link
                                to={`/tournaments/${tournament.slug}`}
                                className="block p-2 rounded-lg hover:bg-gray-700 transition text-white truncate"
                                title={tournament.name}
                            >
                                {tournament.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MyTournamentsList;