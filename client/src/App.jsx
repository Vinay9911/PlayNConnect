// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { UserProvider, useUser } from './context/userContext.jsx';
import AuthPage from './pages/Auth.jsx';
import Modal from './components/Modal.jsx';
import ProfileForm from './pages/ProfileForm.jsx';
import ProfileView from './pages/ProfileView.jsx';
import pNcLogo from './assets/playnconnect_logo.png';

const AppRoutes = () => {
  const { session, userProfile, loading, showProfileModal, setShowProfileModal, handleLogout } = useUser();

  if (loading) {
    return <div className="text-white text-center text-xl">Starting Up...</div>;
  }

  return (
    <>
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)}>
        <div className="text-center">
          <img src={pNcLogo} alt="Profile not found" className="w-20 h-20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No profile found, Gamer.</h2>
          <p className="text-[#9ca3af] mb-6">Create one to continue your journey.</p>
          <Link
            to="/profile/edit"
            onClick={() => setShowProfileModal(false)}
            className="block w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition"
          >
            Create Profile
          </Link>
        </div>
      </Modal>

      <Routes>
        <Route path="/" element={
          <div className="min-h-screen w-full flex items-center justify-center">
            {!session ? <AuthPage /> : (
              <div className="text-center">
                <h1 className="text-white text-2xl mb-4">Welcome, {userProfile?.username || session.user.email}</h1>
                {userProfile && <Link to={`/users/${userProfile.username}`} className="text-[#FF5733] hover:underline text-lg">View My Profile</Link>}
                <button onClick={handleLogout} className="block mx-auto mt-6 bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600">Logout</button>
              </div>
            )}
          </div>
        } />
        <Route path="/profile/edit" element={
          <div className="min-h-screen w-full flex items-center justify-center">
            {session ? <ProfileForm /> : <AuthPage />}
          </div>
        } />
        <Route path="/users/:username" element={
          <div className="min-h-screen w-full flex items-center justify-center">
            <ProfileView />
          </div>
        } />
      </Routes>
    </>
  );
};

const App = () => {
  useEffect(() => {
    document.body.className = 'bg-[#1a1f2e]';
    return () => {
      document.body.className = '';
    }
  }, []);

  return (
    <Router>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </Router>
  );
};

export default App;