import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/userContext.jsx';
import config from '../config.js';
import Accordion from '../components/Accordion.jsx';
import UserSearchModal from '../components/UserSearchModal.jsx';
import pNcLogo from '../assets/playnconnect_logo.png';

const TournamentRegistrationPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { session, userProfile } = useUser();

    // Page State
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Accordion State
    const [activeAccordion, setActiveAccordion] = useState(1);
    
    // Step 1 State
    const [teamName, setTeamName] = useState('');
    const [createdTeam, setCreatedTeam] = useState(null);

    // Step 2 State
    const [isSearchModalOpen, setSearchModalOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);

    // Fetch tournament data on load
    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const response = await fetch(`${config.apiBaseUrl}/tournaments/slug/${slug}`);
                if (!response.ok) throw new Error('Tournament not found.');
                const data = await response.json();
                setTournament(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTournament();
    }, [slug]);

    useEffect(() => {
        // Automatically add the leader to the team members list when the profile is available
        if (userProfile && !teamMembers.some(member => member.id === userProfile.id)) {
            setTeamMembers([userProfile]);
        }
    }, [userProfile, teamMembers]);


    const handleCreateTeam = async () => {
        setError('');
        if (!teamName) {
            setError('Team name is required.');
            return;
        }
        try {
            const token = session.access_token;
            const response = await fetch(`${config.apiBaseUrl}/teams/tournaments/${tournament.id}/teams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: teamName })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.detail);
            
            setCreatedTeam(result.data);
            setActiveAccordion(2); // Open next accordion
        } catch (err) {
            setError(err.message);
        }
    };

    const handleFinalizeRegistration = async () => {
        setError('');
        const memberIds = teamMembers.slice(1).map(member => member.id); // Exclude the leader

        if (memberIds.length === 0) {
            // If it's a solo tournament, finalize immediately
            navigate(`/tournaments/${slug}`);
            return;
        }

        try {
            const token = session.access_token;
            await fetch(`${config.apiBaseUrl}/teams/${createdTeam.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ user_ids: memberIds })
            });
            navigate(`/tournaments/${slug}`);
        } catch (err) {
            console.error(err);
            setError('Failed to add team members.');
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;
    if (error && !isSearchModalOpen) return <div className="text-red-500">{error}</div>;

    return (
        <>
            <div className="bg-[#252b3b] p-8 rounded-2xl shadow-xl w-full max-w-3xl border-2 border-[#FF5733] text-white">
                <img src={tournament?.image_url || pNcLogo} alt="Tournament Banner" className="w-full h-40 object-cover rounded-lg mb-4"/>
                <h1 className="text-3xl font-bold text-center mb-2">{tournament?.name}</h1>
                <p className="text-center text-gray-400 mb-8">Register your team</p>

                {/* --- Step 1: Create Your Team --- */}
                <Accordion title="Step 1: Create Your Team" isOpen={activeAccordion === 1} isCompleted={!!createdTeam} onToggle={() => setActiveAccordion(1)}>
                    <input
                        type="text"
                        placeholder="Enter your team name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg"
                        disabled={!!createdTeam}
                    />
                    <button onClick={handleCreateTeam} disabled={!!createdTeam} className="w-full mt-4 bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-600">
                        Create Team
                    </button>
                </Accordion>

                {/* --- Step 2: Add Your Teammates --- */}
                <Accordion title="Step 2: Add Your Teammates" isOpen={activeAccordion === 2} isCompleted={teamMembers.length === tournament?.max_players_per_team} onToggle={() => setActiveAccordion(2)}>
                    {!createdTeam ? (
                        <p className="text-gray-400">Please create a team first.</p>
                    ) : (
                        <div>
                            {teamMembers.map((member, index) => (
                                <div key={member.id} className="flex items-center bg-[#1a1f2e] p-2 rounded-lg mb-2">
                                    <img src={member.photo_url || pNcLogo} alt={member.username} className="w-10 h-10 rounded-full mr-4"/>
                                    <span className="font-semibold">{member.username}</span>
                                    {index === 0 && <span className="ml-auto text-xs font-bold text-[#FF5733] uppercase">Leader</span>}
                                </div>
                            ))}
                            {teamMembers.length < tournament.max_players_per_team && (
                                <button onClick={() => setSearchModalOpen(true)} className="w-full mt-4 bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-700">
                                    Add Teammate
                                </button>
                            )}
                            <button onClick={() => setActiveAccordion(3)} className="w-full mt-2 bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600">
                                Continue to Summary
                            </button>
                        </div>
                    )}
                </Accordion>

                {/* --- Step 3: Registration Summary --- */}
                <Accordion title="Step 3: Registration Summary" isOpen={activeAccordion === 3} onToggle={() => setActiveAccordion(3)}>
                     {!createdTeam ? (
                         <p className="text-gray-400">Complete the steps above to see the summary.</p>
                     ) : (
                        <div>
                            <h3 className="text-xl font-bold mb-4">Team: {teamName}</h3>
                            {teamMembers.map((member, index) => (
                                <div key={member.id} className="flex items-center bg-[#1a1f2e] p-2 rounded-lg mb-2">
                                    <img src={member.photo_url || pNcLogo} alt={member.username} className="w-10 h-10 rounded-full mr-4"/>
                                    <span className="font-semibold">{member.username}</span>
                                    {index === 0 && <span className="ml-auto text-xs font-bold text-[#FF5733] uppercase">Leader</span>}
                                </div>
                            ))}
                            <button onClick={handleFinalizeRegistration} className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">
                                Game On!
                            </button>
                        </div>
                     )}
                </Accordion>

            </div>

            <UserSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setSearchModalOpen(false)}
                onAddMembers={(newMembers) => {
                    const updatedMembers = [...teamMembers, ...newMembers];
                    setTeamMembers(updatedMembers.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)); // Remove duplicates
                }}
                existingMembers={teamMembers}
                maxMembers={tournament?.max_players_per_team || 0}
            />
        </>
    );
};

export default TournamentRegistrationPage;