// src/pages/TournamentViewPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/userContext.jsx';
import config from '../config.js';
import pNcLogo from '../assets/playnconnect_logo.png';
import { FaEdit, FaTrash } from 'react-icons/fa';

const TournamentViewPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { session } = useUser();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTournament = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${config.apiBaseUrl}/tournaments/slug/${slug}`);
                if (!response.ok) throw new Error((await response.json()).detail);
                setTournament(await response.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTournament();
    }, [slug]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) {
            return;
        }
        try {
            const token = session.access_token;
            const response = await fetch(`${config.apiBaseUrl}/tournaments/${tournament.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.detail || 'Failed to delete tournament.');
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    const userRole = tournament?.tournament_organizers?.find(org => org.user_id === session?.user?.id)?.role;
    const canManage = userRole === 'owner' || userRole === 'admin';
    const isOwner = userRole === 'owner';

    if (loading) return <div className="text-white text-center">Loading Tournament...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;
    if (!tournament) return <div className="text-white text-center">Tournament not found.</div>;

    const formattedDate = new Date(tournament.start_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    return (
        <div className="bg-[#252b3b] p-8 rounded-2xl shadow-xl w-full max-w-4xl border-2 border-[#FF5733] text-white relative">
            {canManage && (
                <div className="absolute top-4 right-4 flex gap-3">
                    <Link to={`/tournaments/${slug}/edit`} className="bg-blue-600 text-white font-bold p-2 rounded-full hover:bg-blue-700 transition" title="Edit Tournament">
                        <FaEdit />
                    </Link>
                    {isOwner && (
                        <button onClick={handleDelete} className="bg-red-600 text-white font-bold p-2 rounded-full hover:bg-red-700 transition" title="Delete Tournament">
                            <FaTrash />
                        </button>
                    )}
                </div>
            )}
            <div className="text-center">
                <img src={tournament.image_url || pNcLogo} alt={tournament.name} className="w-full h-48 object-cover rounded-lg mb-4 bg-gray-700" />
                <h1 className="text-4xl font-bold">{tournament.name}</h1>
                <p className="text-lg text-[#9ca3af] mt-1">{tournament.game}</p>
                <div className="flex justify-center gap-4 text-sm mt-4">
                    <span className="bg-[#1a1f2e] py-1 px-3 rounded-full">{tournament.elimination_type}</span>
                    <span className="bg-[#1a1f2e] py-1 px-3 rounded-full">{tournament.max_teams} Teams</span>
                </div>
            </div>
            <div className="border-t border-gray-600 my-8"></div>
            <div>
                <h3 className="text-2xl font-semibold mb-2">Details</h3>
                <p className="text-[#9ca3af]">{tournament.description || 'No description provided.'}</p>
                <p className="mt-4"><span className="font-bold">Starts on:</span> {formattedDate}</p>
            </div>
            <div className="mt-8 text-center">
                {!session ? (
                    <div className="bg-[#1a1f2e] p-6 rounded-lg">
                        <h3 className="text-xl font-bold mb-2">Ready to Compete?</h3>
                        <p className="text-[#9ca3af] mb-4">Create an account or log in to register for this tournament.</p>
                        <Link to="/" className="bg-[#FF5733] text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition">
                            Sign Up / Log In
                        </Link>
                    </div>
                ) : (
                    <button className="bg-green-600 text-white font-bold py-3 px-12 rounded-lg hover:bg-green-700 transition text-lg">
                        Register Your Team
                    </button>
                )}
            </div>
        </div>
    );
};

export default TournamentViewPage;