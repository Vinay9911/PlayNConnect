// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/userContext.jsx';

import AuthPage from './pages/Auth.jsx';
import Modal from './components/Modal.jsx';
import ProfileForm from './pages/ProfileForm.jsx';
import ProfileView from './pages/ProfileView.jsx';
import TournamentFormPage from './pages/TournamentFormPage.jsx';
import TournamentViewPage from './pages/TournamentView.jsx';
import TournamentRegistrationPage from './pages/TournamentRegistrationPage.jsx';
import pNcLogo from './assets/playnconnect_logo.png';

// This component contains all the routes and logic that need access to the user context.
const AppContent = () => {
    const { session, userProfile, loading, showProfileModal, setShowProfileModal, handleLogout } = useUser();
    const navigate = useNavigate(); // We can use navigate here now

    if (loading) {
        return <div className="text-white text-center text-xl">Starting Up...</div>;
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center">
            <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)}>
                <div className="text-center">
                    <img src={pNcLogo} alt="Profile not found" className="w-20 h-20 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">No profile found, Gamer.</h2>
                    <p className="text-[#9ca3af] mb-6">Create one to continue your journey.</p>
                    <button
                        onClick={() => {
                            setShowProfileModal(false);
                            navigate('/profile/edit');
                        }}
                        className="block w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition"
                    >
                        Create Profile
                    </button>
                </div>
            </Modal>

            <Routes>
                <Route path="/" element={
                    !session ? <AuthPage /> : (
                        <div className="text-center">
                            <h1 className="text-white text-3xl font-bold mb-4">Welcome, {userProfile?.username || session.user.email}</h1>
                            <div className="flex flex-wrap gap-4 justify-center">
                                {userProfile && <Link to={`/users/${userProfile.username}`} className="text-[#FF5733] hover:underline text-lg">View Profile</Link>}
                                <Link to="/tournaments/create" className="bg-[#FF5733] text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition">Create Tournament</Link>
                            </div>
                            <button onClick={handleLogout} className="block mx-auto mt-8 bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600">Logout</button>
                        </div>
                    )
                } />
                <Route path="/profile/edit" element={session ? <ProfileForm /> : <AuthPage />} />
                <Route path="/users/:username" element={<ProfileView />} />
                <Route path="/tournaments/create" element={session ? <TournamentFormPage /> : <AuthPage />} />
                <Route path="/tournaments/:slug/edit" element={session ? <TournamentFormPage /> : <AuthPage />} />
                <Route path="/tournaments/:slug" element={<TournamentViewPage />} />
                <Route path="/tournaments/:slug/register" element={session ? <TournamentRegistrationPage /> : <AuthPage />} />
            </Routes>
        </div>
    );
};

// The main App component now correctly wraps the logic component with the necessary providers.
const App = () => {
    useEffect(() => {
        document.body.className = 'bg-[#1a1f2e]';
        return () => { document.body.className = ''; };
    }, []);

    return (
        <Router>
            <UserProvider>
                <AppContent />
            </UserProvider>
        </Router>
    );
};

export default App;