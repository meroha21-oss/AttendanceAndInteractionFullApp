import api from './api';

export const courseService = {
    // Get all courses
    getAll: () => api.get('/admin/courses'),

    // Get course by ID
    getById: (id) => api.get(`/admin/courses/${id}`),

    // Create new course
    create: (courseData) => api.post('/admin/courses', courseData),

    // Update course
    update: (id, courseData) => api.put(`/admin/courses/${id}`, courseData),

    // Delete course
    delete: (id) => api.delete(`/admin/courses/${id}`),
};