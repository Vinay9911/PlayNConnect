// src/components/FeaturedTournaments.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import pNcLogo from '../assets/playnconnect_logo.png'; // Default image

const FeaturedTournaments = ({ tournaments, loading, error }) => {
    const featured = tournaments.slice(0, 3); // Get top 3

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center md:text-left">Featured Tournaments</h2>
            {loading && <p className="text-gray-400 text-center">Loading...</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}
            {!loading && !error && featured.length === 0 && (
                <p className="text-gray-400 text-center">No featured tournaments right now.</p>
            )}
            {!loading && !error && featured.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featured.map((tournament) => (
                         <div key={tournament.id} className="bg-[#252b3b] rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                            <img
                                src={tournament.image_url || pNcLogo}
                                alt={tournament.name}
                                className="w-full h-32 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-lg font-bold text-white mb-1 truncate">{tournament.name}</h3>
                                <p className="text-xs text-[#FF5733] font-semibold mb-2">{tournament.game}</p>
                                <Link
                                    to={`/tournaments/${tournament.slug}/register`}
                                    className="block w-full bg-blue-600 text-white text-center font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm"
                                >
                                    Register
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeaturedTournaments;