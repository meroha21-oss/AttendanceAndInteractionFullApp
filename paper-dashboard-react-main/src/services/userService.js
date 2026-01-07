import api from './api';

export const userService = {
    // Get all students
    getStudents: () => api.get('/admin/students'),

    // Get all teachers
    getTeachers: () => api.get('/admin/teachers'),

    // Get user by ID
    getUser: (id) => api.get(`/admin/users/${id}`),

    // Update user
    updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),

    // Toggle user active status
    toggleActive: (id) => api.post(`/admin/users/${id}/toggle-active`),
    register: (userData) => {
        // تأكد من استخدام 'multipart/form-data' لارسال الصور
        return api.post('/register', userData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
};