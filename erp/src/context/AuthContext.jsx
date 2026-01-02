import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper function to fetch user profile from database
const fetchUserProfile = async (userId, email) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            console.warn('User profile not found in database, using default:', error.message);
            // Return default profile if not in database yet
            return {
                id: userId,
                email: email,
                name: email.split('@')[0],
                role: 'user',
                status: 'Active',
                permissions: ['all']
            };
        }

        const profile = {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            status: data.status,
            department: data.department,
            share_percentage: data.share_percentage,
            permissions: ['all'],
            avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
        };
        console.log('[AuthContext] Fetched User Profile:', profile.email, 'Role:', profile.role);
        return profile;
    } catch (err) {
        console.error('Error fetching user profile:', err);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Manual session restoration from sessionStorage (cleared on close)
        const restoreSession = () => {
            try {
                // Check if we need to clean up legacy localStorage
                if (localStorage.getItem('app_session')) {
                    localStorage.removeItem('app_session');
                }

                const savedSession = sessionStorage.getItem('app_session');
                if (savedSession) {
                    const sessionData = JSON.parse(savedSession);
                    // Check if session is still valid (not expired)
                    if (sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                        setUser(sessionData.user);
                    } else {
                        sessionStorage.removeItem('app_session');
                    }
                }
            } catch (error) {
                console.error('Failed to restore session:', error);
                sessionStorage.removeItem('app_session');
            }
            setLoading(false);
        };

        restoreSession();
    }, []);

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            if (data.user) {
                let userProfile = await fetchUserProfile(data.user.id, data.user.email);

                if (!userProfile) {
                    await supabase.auth.signOut();
                    return { success: false, error: 'Failed to load user profile' };
                }

                // Check user status
                // Check if profile needs sync (Invited status or ID mismatch)
                // If the user exists in Auth, we trust them. We should claim the Invited profile.
                if (userProfile.status === 'Invited' || userProfile.id !== data.user.id) {
                    try {
                        const token = data.session.access_token;
                        // Call sync-profile to migrate placeholder to real ID
                        await fetch('/api/auth/sync-profile', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        // Refetch profile after sync
                        const updatedProfile = await fetchUserProfile(data.user.id, data.user.email);
                        if (updatedProfile) {
                            userProfile = updatedProfile;
                        }
                    } catch (err) {
                        console.error('Auto-sync failed during login:', err);
                        // Continue if possible, but warn?
                    }
                }

                if (userProfile.status === 'Inactive') {
                    await supabase.auth.signOut();
                    return { success: false, error: 'Account is inactive. Contact administrator.' };
                }

                setUser(userProfile);

                // Manually save session to sessionStorage
                const sessionData = {
                    access_token: data.session.access_token,
                    user: userProfile,
                    expiresAt: Date.now() + (12 * 60 * 60 * 1000) // 12 hours (shorter for session)
                };
                sessionStorage.setItem('app_session', JSON.stringify(sessionData));

                return { success: true };
            }

            return { success: false, error: 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Connection error' };
        }
    };

    const register = async (name, email, password, role) => {
        try {
            // First, sign up with Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                    }
                }
            });

            if (error) {
                return { success: false, error: error.message };
            }

            if (data.user) {
                // Call Backend Sync Profile
                // This will migrate the Invited User (if any) to this new Auth ID
                // and preserve their role/department.
                try {
                    // We need to wait for session to be established? 
                    // access_token is in data.session usually
                    // If email confirmation is off, session is there.

                    const token = data.session?.access_token;
                    if (token) {
                        // Use relative path via Proxy
                        const response = await fetch('/api/auth/sync-profile', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ name, role })
                        });

                        if (!response.ok) {
                            const errData = await response.json();
                            throw new Error(errData.error || 'Sync Profile Failed');
                        }
                    } else {
                        console.warn('No session token after signup - Email confirmation might be required.');
                    }

                } catch (syncError) {
                    console.error('Profile sync error:', syncError);
                    // We don't fail registration entirely, but user might have issues until they login again
                }

                const userProfile = await fetchUserProfile(data.user.id, email);

                // If sync worked, we should have a profile.
                if (userProfile) {
                    setUser(userProfile);
                    return { success: true };
                } else {
                    return { success: true, warning: 'Account created but profile sync delayed.' };
                }
            }

            return { success: false, error: 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            sessionStorage.removeItem('app_session'); // Clear manual session
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if there's an error
            setUser(null);
            sessionStorage.removeItem('app_session'); // Clear manual session
            window.location.href = '/login';
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
