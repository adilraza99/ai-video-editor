import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Don't set Content-Type for FormData - let browser handle it
        // This is important for file uploads with multipart/form-data
        if (config.data instanceof FormData) {
            // Remove Content-Type to let browser set it with boundary
            delete config.headers['Content-Type'];
        } else if (!config.headers['Content-Type']) {
            // Set JSON as default only if not already set and not FormData
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
