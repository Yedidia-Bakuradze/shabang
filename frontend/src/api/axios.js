import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        console.log("Interceptor: Token from cookie:", token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("Interceptor: Added Authorization header");
        } else {
            console.log("Interceptor: No token found");
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., redirect to login)
            Cookies.remove('token');
            // Optional: window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
