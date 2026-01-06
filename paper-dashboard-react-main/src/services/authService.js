import api, { apiForm } from './api';

export const authService = {
    login: (email, password) => {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        return apiForm('/login', formData);
    },

    register: (userData) => {
        const formData = new FormData();
        Object.keys(userData).forEach(key => {
            if (userData[key] !== null && userData[key] !== undefined) {
                formData.append(key, userData[key]);
            }
        });
        return apiForm('/register', formData);
    },

    logout: () => api.post('/logout'),

    verifyEmail: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return apiForm('/verify-email', formData);
    },

    resendVerificationCode: (email) => {
        const formData = new FormData();
        formData.append('email', email);
        return apiForm('/resend-verification-code', formData);
    },

    forgotPassword: (email) => {
        const formData = new FormData();
        formData.append('email', email);
        return apiForm('/forgot-password', formData);
    },

    resetPassword: (email, code, password, passwordConfirmation) => {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('code', code);
        formData.append('password', password);
        formData.append('password_confirmation', passwordConfirmation);
        return apiForm('/reset-password', formData);
    },

    refreshToken: (refreshToken) => {
        const formData = new FormData();
        formData.append('refresh_token', refreshToken);
        return apiForm('/refresh-token', formData);
    },

    // Helper function to get current user
    getCurrentUser: () => api.get('/user'),

    // Helper function to update user profile
    updateProfile: (userData) => {
        const formData = new FormData();
        Object.keys(userData).forEach(key => {
            if (userData[key] !== null && userData[key] !== undefined) {
                formData.append(key, userData[key]);
            }
        });
        return apiForm('/profile', formData);
    },

    // Helper function to change password
    changePassword: (currentPassword, newPassword, newPasswordConfirmation) => {
        const formData = new FormData();
        formData.append('current_password', currentPassword);
        formData.append('password', newPassword);
        formData.append('password_confirmation', newPasswordConfirmation);
        return apiForm('/change-password', formData);
    }
};

export default authService;