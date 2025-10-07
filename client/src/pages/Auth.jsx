import React, { useState } from 'react';
import { supabase } from '../utils/supabase.jsx';
import Login from '../components/Login.jsx';
import SignUp from '../components/Signup.jsx';
import { FcGoogle } from 'react-icons/fc';
import pNcLogo from '../assets/playnconnect_logo.png'; 

const AuthPage = () => {
    const [view, setView] = useState('login'); 

    const handleGoogleSignIn = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            console.error('Error signing in with Google:', error);
        }
    };
    
    return (
        <div className="bg-[#252b3b] p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-md border-2 border-[#FF5733]">
            <img src={pNcLogo} alt="PlayNConnect Logo" className="w-24 mx-auto mb-1" />
            
            {view === 'login' ? <Login setView={setView} /> : <SignUp setView={setView} />}
            
            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="mx-4 text-[#9ca3af]">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-[#1a1f2e] border border-gray-600 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition duration-300"
            >
                {/* Use the imported react-icons component here */}
                <FcGoogle className="w-6 h-6" /> 
                Sign in with Google
            </button>
        </div>
    );
};

export default AuthPage;