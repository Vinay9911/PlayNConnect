// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/userContext.jsx';
import config from '../config.js';

// Import Dashboard Components
import Navbar from '../components/Navbar.jsx';
import UserList from '../components/UserList.jsx';
import MyTournamentsList from '../components/MyTournamentsList.jsx';
import FeaturedTournaments from '../components/FeaturedTournaments.jsx';
import FloatingBottomNav from '../components/FloatingBottomNav.jsx';

const DashboardPage = () => {
    const { session } = useUser();
    const [myTournaments, setMyTournaments] = useState([]);
    const [allTournaments, setAllTournaments] = useState([]);
    const [loadingMy, setLoadingMy] = useState(true);
    const [loadingAll, setLoadingAll] = useState(true);
    const [errorMy, setErrorMy] = useState('');
    const [errorAll, setErrorAll] = useState('');

    useEffect(() => {
        // Fetch My Tournaments (requires auth)
        const fetchMyTournaments = async () => {
            if (!session) {
                setLoadingMy(false);
                setMyTournaments([]); // Don't fetch if no session
            }
            setLoadingMy(true);
            setErrorMy('');
            try {
                const token = session.access_token;
                const response = await fetch(`${config.apiBaseUrl}/tournaments/my-tournaments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch your tournaments.');
                }
                const data = await response.json();
                console.log('My Tournaments Data:', data); // Debug log
                setMyTournaments(data);
            } catch (err) {
                setErrorMy(err.message);
                setMyTournaments([]);
            } finally {
                setLoadingMy(false);
            }
        };

        // Fetch All Tournaments (public)
        const fetchAllTournaments = async () => {
            setLoadingAll(true);
            setErrorAll('');
            try {
                const response = await fetch(`${config.apiBaseUrl}/tournaments`);
                if (!response.ok) {
                    throw new Error('Failed to fetch all tournaments.');
                }
                const data = await response.json();
                setAllTournaments(data);
            } catch (err) {
                setErrorAll(err.message);
                setAllTournaments([]);
            } finally {
                setLoadingAll(false);
            }
        };

        fetchMyTournaments();
        fetchAllTournaments();

    }, []);

    // Combine loading states for a general loading indicator if needed
    // eslint-disable-next-line no-unused-vars
    const isLoading = loadingMy || loadingAll;

    return (
        <div className="w-full min-h-screen bg-[#1a1f2e] text-white">
            <Navbar /> {/* Fixed Navbar */}

            {/* Main Content Area with padding for Navbar and BottomNav */}
            <main className="max-w-7xl mx-auto px-4 py-20 md:pb-8"> {/* pt-20 for Navbar, pb-8 for general padding */}
                {/* Top Section: User List & My Tournaments */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-1">
                        <UserList />
                    </div>
                    <div className="md:col-span-2">
                        <MyTournamentsList
                            tournaments={myTournaments}
                            loading={loadingMy}
                            error={errorMy}
                        />
                    </div>
                </div>

                {/* Bottom Section: Featured Tournaments */}
                <FeaturedTournaments
                    tournaments={allTournaments}
                    loading={loadingAll}
                    error={errorAll}
                />
            </main>

            <FloatingBottomNav /> {/* Fixed Bottom Navbar */}
        </div>
    );
};

export default DashboardPage;