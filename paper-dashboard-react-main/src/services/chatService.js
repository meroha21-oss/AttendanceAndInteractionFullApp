import api from './api';

export const chatService = {
    // Teacher: Get chat messages for a lecture
    getTeacherChat: (lectureId) => api.get(`/teacher/lectures/${lectureId}/chat`),

    // Teacher: Send message in lecture chat
    sendTeacherMessage: (lectureId, message) => api.post(`/teacher/lectures/${lectureId}/chat`, { message }),

    // Student: Get chat messages for a lecture
    getStudentChat: (lectureId) => api.get(`/student/lectures/${lectureId}/chat`),

    // Student: Send message in lecture chat
    sendStudentMessage: (lectureId, message) => api.post(`/student/lectures/${lectureId}/chat`, { message }),
};