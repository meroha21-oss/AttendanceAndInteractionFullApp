import api from './api';

export const sectionService = {
    // Get all sections
    getAll: () => api.get('/admin/sections'),

    // Get section by ID
    getById: (id) => api.get(`/admin/sections/${id}`),

    // Create new section
    create: (sectionData) => api.post('/admin/sections', sectionData),

    // Update section
    update: (id, sectionData) => api.put(`/admin/sections/${id}`, sectionData),

    // Delete section
    delete: (id) => api.delete(`/admin/sections/${id}`),

    // Get enrollments by section
    getEnrollments: (sectionId) => api.get(`/admin/sections/${sectionId}/enrollments`),
};