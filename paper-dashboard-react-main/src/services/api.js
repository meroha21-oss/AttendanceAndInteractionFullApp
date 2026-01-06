import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

// Base URL for the API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance for API calls
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true, // Important for CSRF cookies
});

// Create separate instance for CSRF cookie requests
const csrfApi = axios.create({
    withCredentials: true,
});

// Flag to track CSRF initialization
let csrfInitialized = false;
let csrfInitializing = false;
let csrfQueue = [];

/**
 * Initialize CSRF token by fetching from Laravel
 */
const initializeCSRF = async () => {
    if (csrfInitialized) {
        return true;
    }

    if (csrfInitializing) {
        // Wait for existing initialization to complete
        return new Promise((resolve) => {
            csrfQueue.push(resolve);
        });
    }

    csrfInitializing = true;

    try {
        console.log('Initializing CSRF token...');

        // Fetch CSRF cookie from Laravel Sanctum
        await csrfApi.get('http://127.0.0.1:8000/sanctum/csrf-cookie');

        console.log('CSRF cookie fetched successfully');
        csrfInitialized = true;
        csrfInitializing = false;

        // Resolve all queued promises
        csrfQueue.forEach(resolve => resolve(true));
        csrfQueue = [];

        return true;
    } catch (error) {
        console.error('Failed to initialize CSRF:', error);
        csrfInitialized = false;
        csrfInitializing = false;

        // Reject all queued promises
        csrfQueue.forEach(resolve => resolve(false));
        csrfQueue = [];

        return false;
    }
};

/**
 * Get CSRF token from cookie
 */
const getCSRFToken = () => {
    try {
        const cookies = document.cookie.split(';');
        const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));

        if (csrfCookie) {
            return csrfCookie.split('=')[1];
        }

        // Alternative name for CSRF token
        const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('laravel_session='));
        if (xsrfCookie) {
            return xsrfCookie.split('=')[1];
        }

        return null;
    } catch (error) {
        console.warn('Error getting CSRF token:', error);
        return null;
    }
};

/**
 * Generic function for FormData submissions with CSRF
 */
export const apiForm = (url, formData, config = {}) => {
    // Ensure we have CSRF token for form submissions
    const csrfToken = getCSRFToken();

    return api.post(url, formData, {
        ...config,
        headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
            'X-XSRF-TOKEN': csrfToken || '',
        },
    });
};

// Request interceptor to add tokens and CSRF
api.interceptors.request.use(
    async (config) => {
        // Add Bearer token if available
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // For non-GET requests, ensure CSRF token is included
        if (config.method !== 'get') {
            // Ensure CSRF is initialized
            if (!csrfInitialized) {
                await initializeCSRF();
            }

            // Get CSRF token from cookie
            const csrfToken = getCSRFToken();
            if (csrfToken) {
                config.headers['X-XSRF-TOKEN'] = csrfToken;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle CSRF token mismatch (419)
        if (error.response?.status === 419 && !originalRequest._retryCSRF) {
            originalRequest._retryCSRF = true;

            console.log('CSRF token expired, getting new one...');

            try {
                // Get new CSRF cookie
                await initializeCSRF();

                // Retry the original request
                return api(originalRequest);
            } catch (csrfError) {
                console.error('Failed to refresh CSRF:', csrfError);
                enqueueSnackbar('Session expired. Please refresh the page.', {
                    variant: 'error',
                    autoHideDuration: 5000,
                });
            }
        }

        // Handle 401 Unauthorized (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(
                    `${API_BASE_URL}/refresh-token`,
                    { refresh_token: refreshToken },
                    {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        withCredentials: true,
                    }
                );

                if (response.data.success) {
                    const { access_token } = response.data.data;
                    localStorage.setItem('access_token', access_token);

                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                localStorage.clear();
                window.location.href = '/login';
            }
        }

        // Handle other errors
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    enqueueSnackbar('Bad request. Please check your input.', {
                        variant: 'error',
                    });
                    break;
                case 403:
                    enqueueSnackbar('Access denied.', { variant: 'error' });
                    break;
                case 404:
                    enqueueSnackbar('Resource not found.', { variant: 'error' });
                    break;
                case 422:
                    const errors = error.response.data.errors;
                    if (errors) {
                        Object.values(errors).forEach((errorArray) => {
                            errorArray.forEach((errorMessage) => {
                                enqueueSnackbar(errorMessage, { variant: 'error' });
                            });
                        });
                    } else if (error.response.data.message) {
                        enqueueSnackbar(error.response.data.message, { variant: 'error' });
                    }
                    break;
                case 500:
                    enqueueSnackbar('Server error. Please try again later.', {
                        variant: 'error',
                    });
                    break;
                default:
                    if (error.response.data?.message) {
                        enqueueSnackbar(error.response.data.message, {
                            variant: 'error',
                        });
                    }
            }
        } else if (error.request) {
            enqueueSnackbar('Network error. Please check your connection.', {
                variant: 'error',
            });
        } else {
            enqueueSnackbar('Request error. Please try again.', {
                variant: 'error',
            });
        }

        return Promise.reject(error);
    }
);

// Export specific API functions for auth
export const login = async (email, password) => {
    try {
        // Initialize CSRF first
        await initializeCSRF();

        // Make login request with FormData
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const response = await apiForm('/login', formData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const register = async (userData) => {
    try {
        await initializeCSRF();

        const formData = new FormData();
        Object.keys(userData).forEach(key => {
            if (userData[key] !== null && userData[key] !== undefined) {
                formData.append(key, userData[key]);
            }
        });

        const response = await apiForm('/register', formData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Initialize CSRF on module load
initializeCSRF().then(initialized => {
    console.log('CSRF initialized:', initialized);
});

export default api;
export { initializeCSRF, getCSRFToken };