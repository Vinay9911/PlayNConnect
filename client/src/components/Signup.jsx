// src/components/Signup.jsx (Updated)
import React, { useState } from 'react';
import config from '../config.js';

const SignUp = ({ setView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Use the apiBaseUrl from the config object
        const response = await fetch(`${config.apiBaseUrl}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            setError(data.detail || 'Failed to sign up.');
        } else {
            setMessage('Signup successful! Please check your email to confirm.');
            setEmail('');
            setPassword('');
        }
    };

    return (
        <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-center text-white mb-6">Create Account</h2>
            <form onSubmit={handleSignUp} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-[#FF5733]"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#1a1f2e] text-white border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5733] focus:border-[#FF5733]"
                />
                <button type="submit" className="w-full bg-[#FF5733] text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition duration-300">
                    Sign Up
                </button>
            </form>
            {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            {message && <p className="mt-4 text-center text-green-500">{message}</p>}
            <p className="mt-6 text-center text-[#9ca3af]">
                Already have an account?{' '}
                <button onClick={() => setView('login')} className="text-[#FF5733] hover:underline font-semibold">
                    Log In
                </button>
            </p>
        </div>
    );
};

export default SignUp;