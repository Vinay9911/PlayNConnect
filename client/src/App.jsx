// src/App.jsx (Updated)
import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase.jsx';
import AuthPage from './pages/Auth.jsx';

export default function App() {
    const [session, setSession] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Main container with the new dark background color
    return (
        <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center p-4">
            {!session ? (
                <AuthPage />
            ) : (
                <div className="text-center">
                    <div className="bg-[#252b3b] p-10 rounded-2xl shadow-lg text-white">
                        <h1 className="text-3xl font-bold">Logged In</h1>
                        <p className="mt-2 text-[#9ca3af]">Welcome, {session.user.email}</p>
                        <button 
                            onClick={handleLogout}
                            className="mt-6 bg-[#FF5733] text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-600 transition duration-300"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}