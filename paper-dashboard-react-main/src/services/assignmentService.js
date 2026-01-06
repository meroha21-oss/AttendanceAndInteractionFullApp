import api from './api';

export const assignmentService = {
    // Get all assignments
    getAll: () => api.get('/admin/assignments'),

    // Get assignment by ID
    getById: (id) => api.get(`/admin/assignments/${id}`),

    // Create assignment (auto-generates lectures)
    create: (assignmentData) => api.post('/admin/assignments', assignmentData),

    // Update assignment
    update: (id, assignmentData) => api.put(`/admin/assignments/${id}`, assignmentData),

    // Delete assignment
    delete: (id) => api.delete(`/admin/assignments/${id}`),
};