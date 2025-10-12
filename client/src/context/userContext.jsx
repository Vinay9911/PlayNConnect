// src/context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase.jsx';
import config from '../config.js';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileCheckCompleted, setProfileCheckCompleted] = useState(false);

  useEffect(() => {
    const fetchProfile = async (currentSession) => {
      if (!currentSession) return;
      try {
        const token = currentSession.access_token;
        const response = await fetch(`${config.apiBaseUrl}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok && data.profile) {
          setUserProfile(data.profile);
        } else {
          setUserProfile(null);
          setShowProfileModal(true);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setProfileCheckCompleted(true);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && !profileCheckCompleted) {
        fetchProfile(session);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setShowProfileModal(false);
        setProfileCheckCompleted(false);
        navigate('/');
      } else if (!session) {
        setLoading(false);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && !profileCheckCompleted) {
            fetchProfile(session);
        } else {
            setLoading(false);
        }
    });

    return () => subscription.unsubscribe();
  }, [navigate, profileCheckCompleted]);

  const value = {
    session,
    userProfile,
    loading,
    showProfileModal,
    setShowProfileModal,
    handleLogout: async () => await supabase.auth.signOut(),
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};