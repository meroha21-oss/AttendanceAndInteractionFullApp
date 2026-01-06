import api from './api';

export const enrollmentService = {
    // Get all enrollments
    getAll: () => api.get('/admin/enrollments'),

    // Get enrollment by ID
    getById: (id) => api.get(`/admin/enrollments/${id}`),

    // Create enrollment (single)
    create: (enrollmentData) => api.post('/admin/enrollments', enrollmentData),

    // Bulk enrollment
    bulkCreate: (bulkData) => api.post('/admin/enrollments/bulk', bulkData),

    // Delete enrollment
    delete: (id) => api.delete(`/admin/enrollments/${id}`),
};