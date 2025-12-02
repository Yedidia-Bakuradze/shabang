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
            // Backend returns { access_token: "...", refresh_token: "...", user: {...} }
            const { access_token } = response.data;
            console.log("Login response data:", response.data);
            
            const token = access_token;
            
            if (!token) {
                throw new Error("Token not received from server");
            }
            
            console.log("Setting token cookie:", token.substring(0, 20) + '...');
            Cookies.set('token', token, { expires: 7 }); // Expires in 7 days
            
            // Verify cookie was set
            const savedToken = Cookies.get('token');
            console.log("Verified token from cookie:", savedToken ? 'Success' : 'Failed');

            // Manually set user state immediately with the profile from login response
            try {
                const response = await api.get('/auth/profile/');
                console.log('Login: Profile fetched successfully');
                setUser(response.data);
            } catch (error) {
                console.error('Login: Failed to fetch profile after login', error);
                // Still return true if token was set
            }
            toast.success('Successfully logged in!');
            return true;
        } catch (error) {
            console.error("Login failed", error);
            toast.error(error.response?.data?.detail || 'Login failed. Please check your credentials and internet connection.');
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
            Object.values(error.response.data).flat().forEach((msg)=>{toast.error(msg);});
            return false;
        }
    };

    const logout = () => {
        Cookies.remove('token');
        setUser(null);
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
