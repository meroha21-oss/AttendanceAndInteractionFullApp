import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [csrfInitialized, setCsrfInitialized] = useState(false);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    // Helper to get cookie
    const getCookie = useCallback((name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
        return null;
    }, []);

    // Initialize CSRF token
    const initializeCsrf = useCallback(async () => {
        try {
            console.log('Initializing CSRF token...');
            const response = await fetch('http://127.0.0.1:8000/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                console.log('CSRF token initialized successfully');
                setCsrfInitialized(true);
                return true;
            } else {
                console.warn('CSRF token initialization failed with status:', response.status);
                return false;
            }
        } catch (error) {
            console.error('CSRF init failed:', error);
            return false;
        }
    }, []);

    // Get CSRF token
    const getCsrfToken = useCallback(() => {
        return getCookie('XSRF-TOKEN');
    }, [getCookie]);

    // Login function
    const login = useCallback(async (email, password) => {
        try {
            setLoading(true);
            console.log('Attempting login with:', email);

            // Ensure CSRF is initialized
            if (!csrfInitialized) {
                await initializeCsrf();
            }

            // Get CSRF token
            const csrfToken = getCsrfToken();
            console.log('CSRF token:', csrfToken ? 'Found' : 'Not found');

            const formData = new FormData();
            formData.append('login', email);  // Change 'email' to 'login'
            formData.append('password', password);

            console.log('Making login request...');

            // Make login request
            const response = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: formData,
            });

            console.log('Login response status:', response.status);

            // Parse response
            let result;
            try {
                result = await response.json();
                console.log('Login response data:', result);
            } catch (parseError) {
                console.error('Failed to parse login response:', parseError);
                throw new Error('Invalid server response');
            }

            if (response.ok && result.success) {
                const { access_token, refresh_token, user: userData } = result.data;

                // Store tokens and user data
                localStorage.setItem('access_token', access_token);
                if (refresh_token) {
                    localStorage.setItem('refresh_token', refresh_token);
                }
                localStorage.setItem('user', JSON.stringify(userData));

                // Update state
                setAccessToken(access_token);
                setRefreshToken(refresh_token);
                setUser(userData);

                enqueueSnackbar('Login successful', { variant: 'success' });

                // Redirect based on role
                switch (userData.role) {
                    case 'admin':
                        navigate('/admin/dashboard');
                        break;
                    case 'teacher':
                        navigate('/teacher/dashboard');
                        break;
                    case 'student':
                        navigate('/student/dashboard');
                        break;
                    default:
                        navigate('/dashboard');
                }

                return { success: true, data: result };
            } else {
                const errorMessage = result.message || `Login failed (${response.status})`;
                enqueueSnackbar(errorMessage, { variant: 'error' });
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Login error:', error);

            let errorMessage = 'Login failed. Please check your credentials.';
            if (error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('CSRF')) {
                errorMessage = 'Session error. Please refresh the page.';
            }

            enqueueSnackbar(errorMessage, { variant: 'error' });
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [csrfInitialized, initializeCsrf, getCsrfToken, navigate, enqueueSnackbar]);

    // Logout function
    const logout = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token');
            const csrfToken = getCsrfToken();

            if (token) {
                await fetch('http://127.0.0.1:8000/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'X-XSRF-TOKEN': csrfToken || '',
                    },
                    credentials: 'include',
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear everything
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');

            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
            setCsrfInitialized(false);

            enqueueSnackbar('Logged out successfully', { variant: 'success' });
            navigate('/login');
        }
    }, [getCsrfToken, navigate, enqueueSnackbar]);

    // Register function
    const register = useCallback(async (userData) => {
        try {
            setLoading(true);

            // Ensure CSRF is initialized
            if (!csrfInitialized) {
                await initializeCsrf();
            }

            // Get CSRF token
            const csrfToken = getCsrfToken();

            // Create FormData
            const formData = new FormData();
            Object.keys(userData).forEach(key => {
                if (userData[key] !== null && userData[key] !== undefined) {
                    formData.append(key, userData[key]);
                }
            });

            // Make register request
            const response = await fetch('http://127.0.0.1:8000/api/register', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': csrfToken || '',
                },
                credentials: 'include',
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                enqueueSnackbar('Registration successful', { variant: 'success' });
                return { success: true, data: result };
            } else {
                const errorMessage = result.message || 'Registration failed';
                enqueueSnackbar(errorMessage, { variant: 'error' });
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Registration error:', error);
            enqueueSnackbar('Registration failed', { variant: 'error' });
            return { success: false, error: 'Registration failed' };
        } finally {
            setLoading(false);
        }
    }, [csrfInitialized, initializeCsrf, getCsrfToken, enqueueSnackbar]);

    // API request function (for making authenticated requests)
    const apiRequest = useCallback(async (url, options = {}) => {
        try {
            // Get current token
            let currentToken = accessToken || localStorage.getItem('access_token');

            // Prepare headers
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers,
            };

            // Add Authorization header if token exists
            if (currentToken) {
                headers['Authorization'] = `Bearer ${currentToken}`;
            }

            // For non-GET requests, add CSRF token
            if (options.method && options.method !== 'GET') {
                if (!csrfInitialized) {
                    await initializeCsrf();
                }
                const csrfToken = getCsrfToken();
                if (csrfToken) {
                    headers['X-XSRF-TOKEN'] = csrfToken;
                }
            }

            // Prepare request config
            const config = {
                method: options.method || 'GET',
                headers,
                credentials: 'include',
                ...options,
                body: options.body ? JSON.stringify(options.body) : undefined,
            };

            console.log(`Making ${config.method} request to:`, url);

            // Make the request
            const response = await fetch(`http://127.0.0.1:8000/api${url}`, config);

            // Handle 401 Unauthorized (token expired)
            if (response.status === 401 && currentToken) {
                try {
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (!refreshToken) {
                        throw new Error('No refresh token');
                    }

                    // Try to refresh the token
                    const refreshResponse = await fetch('http://127.0.0.1:8000/api/refresh-token', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    });

                    const refreshResult = await refreshResponse.json();

                    if (refreshResult.success) {
                        const { access_token, refresh_token } = refreshResult.data;

                        // Store new tokens
                        localStorage.setItem('access_token', access_token);
                        localStorage.setItem('refresh_token', refresh_token);

                        // Update state
                        setAccessToken(access_token);
                        setRefreshToken(refresh_token);

                        // Retry the original request with new token
                        headers['Authorization'] = `Bearer ${access_token}`;
                        config.headers = headers;

                        return await fetch(`http://127.0.0.1:8000/api${url}`, config);
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    logout();
                    throw new Error('SESSION_EXPIRED');
                }
            }

            return response;
        } catch (error) {
            if (error.message === 'SESSION_EXPIRED') {
                enqueueSnackbar('Session expired. Please login again.', { variant: 'warning' });
            }
            throw error;
        }
    }, [accessToken, csrfInitialized, initializeCsrf, getCsrfToken, logout, enqueueSnackbar]);

    // Refresh access token
    const refreshAccessToken = useCallback(async () => {
        try {
            const currentRefreshToken = refreshToken || localStorage.getItem('refresh_token');
            if (!currentRefreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch('http://127.0.0.1:8000/api/refresh-token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ refresh_token: currentRefreshToken }),
            });

            const result = await response.json();

            if (result.success) {
                const { access_token, refresh_token: newRefreshToken } = result.data;

                // Update tokens
                setAccessToken(access_token);
                setRefreshToken(newRefreshToken);
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', newRefreshToken);

                return access_token;
            } else {
                throw new Error(result.message || 'Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
            throw error;
        }
    }, [refreshToken, logout]);

    // Initialize on mount
    useEffect(() => {
        const initialize = async () => {
            try {
                // Initialize CSRF
                await initializeCsrf();

                // Check for existing user
                const storedUser = localStorage.getItem('user');
                const token = localStorage.getItem('access_token');

                if (storedUser && token) {
                    try {
                        const userData = JSON.parse(storedUser);
                        setUser(userData);
                        setAccessToken(token);

                        // Validate token by making a test request
                        const testResponse = await apiRequest('/user');
                        if (!testResponse.ok) {
                            throw new Error('Token invalid');
                        }
                    } catch (error) {
                        console.log('Token validation failed:', error);
                        localStorage.clear();
                        setUser(null);
                        setAccessToken(null);
                    }
                }
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const value = {
        user,
        accessToken,
        loading,
        login,
        logout,
        register,
        apiRequest,
        refreshAccessToken,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
        csrfInitialized,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};