// Format date for display
export const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Format time for display
export const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Format date and time
export const formatDateTime = (dateString) => {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

// Get user initials
export const getUserInitials = (fullName) => {
    if (!fullName) return 'U';

    return fullName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

// Check if object is empty
export const isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
};

// Get role display name
export const getRoleDisplayName = (role) => {
    const roles = {
        admin: 'Administrator',
        teacher: 'Teacher',
        student: 'Student',
    };
    return roles[role] || role;
};

// Validate email
export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Debounce function
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};