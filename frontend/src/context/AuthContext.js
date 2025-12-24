import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = Cookies.get('token');
        if (token) {
            try {
                const response = await api.get('/auth/profile/');
                setUser(response.data);
            } catch (error) {
                console.error("Auth check failed", error);
                Cookies.remove('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login/', { username, password });
            const { access_token } = response.data;

            Cookies.set('token', access_token, { expires: 7 });

            const profileRes = await api.get('/auth/profile/');
            setUser(profileRes.data);

            toast.success('Successfully logged in!');
            return { success: true };
        } catch (error) {
            if (error.response?.status === 403 && error.response?.data?.error === 'recovery_required') {
                return {
                    success: false,
                    recoveryRequired: true,
                    message: error.response.data.message
                };
            }
            toast.error(error.response?.data?.error || 'Login failed. Please check your credentials and internet connection.');
            return { success: false };
        }
    };

    const recoverAccount = async (username, password) => {
        try {
            await api.post('/auth/recover/', { username, password });
            toast.success("Account recovered! You can now log in.");
            return true;
        } catch (error) {
            toast.error(error.response?.data?.error || "Recovery failed");
            return false;
        }
    };

    const signup = async (userData) => {
        try {
            await api.post('/auth/signup/', userData);
            toast.success('Account created! Please log in.');
            return true;
        } catch (error) {
            console.error("Signup failed", error);
            Object.values(error.response.data).flat().forEach((msg) => { toast.error(msg); });
            return false;
        }
    };

    const logout = () => {
        Cookies.remove('token');
        setUser(null);
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, recoverAccount }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);