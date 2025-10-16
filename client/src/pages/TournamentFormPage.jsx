// src/pages/TournamentFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../context/userContext.jsx';
import config from '../config.js';
import { FaUpload } from 'react-icons/fa';
import pNcLogo from '../assets/playnconnect_logo.png';

// --- DATA SOURCE: Game list is now managed inside the component ---
const GAMES_LIST = [
    { key: 'codm', name: 'COD Mobile' },
    { key: 'valorant', name: 'Valorant' },
    { key: 'bgmi', name: 'BGMI' },
    { key: 'csgo', name: 'Counter-Strike 2' },
    { key: 'lol', name: 'League of Legends' }
];

const TournamentFormPage = () => {
    const { slug } = useParams();
    const isEditMode = Boolean(slug);
    
    const navigate = useNavigate();
    const { session } = useUser();

    // Form State
    const [tournamentId, setTournamentId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [game, setGame] = useState(GAMES_LIST[0].key);
    const [eliminationType, setEliminationType] = useState('Single Elimination');
    const [startDate, setStartDate] = useState('');
    const [maxTeams, setMaxTeams] = useState('8');
    const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState('5');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(isEditMode);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchTournamentData = async () => {
            if (!isEditMode) return;
            try {
                // Since this endpoint is now public, no auth token is needed
                const response = await fetch(`${config.apiBaseUrl}/tournaments/slug/${slug}`);
                if (!response.ok) throw new Error('Tournament not found.');
                const data = await response.json();
                
                setName(data.name || '');
                setDescription(data.description || '');
                setGame(data.game);
                setEliminationType(data.elimination_type || 'Single Elimination');
                setStartDate(data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : '');
                setMaxTeams(data.max_teams || '8');
                setMaxPlayersPerTeam(data.max_players_per_team || '5');
                setImageUrl(data.image_url || '');
                setTournamentId(data.id);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTournamentData();
    }, [slug, isEditMode]);

    const handleImageSelect = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
        }
    };

    const uploadImage = async (tourneyId) => {
        if (!imageFile) return null;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', imageFile);
            const token = session.access_token;

            const response = await fetch(`${config.apiBaseUrl}/tournaments/${tourneyId}/image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Image upload failed.');
            return data.data.image_url;
        } catch (err) {
            setError(`Image upload failed: ${err.message}`);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = session.access_token;
            
            if (isEditMode) {
                const updatedImageUrl = imageFile ? await uploadImage(tournamentId) : imageUrl;
                const tournamentData = { name, description, game, elimination_type: eliminationType, start_date: new Date(startDate).toISOString(), max_teams: parseInt(maxTeams), max_players_per_team: parseInt(maxPlayersPerTeam), image_url: updatedImageUrl };
                const response = await fetch(`${config.apiBaseUrl}/tournaments/${tournamentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(tournamentData)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.detail || 'Failed to update tournament.');
                navigate(`/tournaments/${result.data.slug || slug}`);
            } else {
                const tournamentData = { name, description, game, elimination_type: eliminationType, start_date: new Date(startDate).toISOString(), max_teams: parseInt(maxTeams), max_players_per_team: parseInt(maxPlayersPerTeam) };
                const response = await fetch(`${config.apiBaseUrl}/tournaments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(tournamentData)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.detail || 'Failed to create tournament.');
                
                const newTournament = result.data;
                if (imageFile) {
                    await uploadImage(newTournament.id);
                }
                navigate(`/tournaments/${newTournament.slug}`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) return <div className="text-white">Loading Tournament Data...</div>;

    return (
        <div className="bg-[#252b3b] p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-2xl border-2 border-[#FF5733] max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold text-center text-white mb-8">{isEditMode ? 'Edit Tournament' : 'Create a New Tournament'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <img src={imageUrl || pNcLogo} alt="Tournament Banner Preview" className="w-full h-40 rounded-lg object-cover bg-gray-700 border-2 border-gray-600" />
                    <label htmlFor="image-upload" className="cursor-pointer bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
                        <FaUpload />
                        {uploading ? 'Uploading...' : 'Upload Banner'}
                    </label>
                    <input id="image-upload" type="file" accept="image/png, image/jpeg" onChange={handleImageSelect} disabled={uploading} className="hidden" />
                </div>
                <input type="text" placeholder="Tournament Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]" />
                <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733]" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <select value={game} onChange={(e) => setGame(e.target.value)} className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg">
                        {GAMES_LIST.map(g => (
                            <option key={g.key} value={g.key}>{g.name}</option>
                        ))}
                    </select>
                    <select value={eliminationType} onChange={(e) => setEliminationType(e.target.value)} className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg">
                        <option>Single Elimination</option>
                        <option>Double Elimination</option>
                        <option>Round Robin</option>
                    </select>
                </div>
                <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="number" placeholder="Max Teams" value={maxTeams} onChange={(e) => setMaxTeams(e.target.value)} required min="2" className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg" />
                    <input type="number" placeholder="Players per Team" value={maxPlayersPerTeam} onChange={(e) => setMaxPlayersPerTeam(e.target.value)} required min="1" className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg" />
                </div>
                <button type="submit" className="w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition duration-300 mt-6" disabled={loading || uploading}>
                    {loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Tournament')}
                </button>
                {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            </form>
        </div>
    );
};

export default TournamentFormPage;