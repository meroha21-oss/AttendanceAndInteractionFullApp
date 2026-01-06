import api from './api';

export const attendanceService = {
    // Student: Get attendance token
    getToken: (lectureId) => api.post('/student/attendance/token', { lecture_id: lectureId }),

    // Student: Send heartbeat
    sendHeartbeat: (token) => api.post('/student/attendance/heartbeat', { token }),

    // Student: End attendance (when leaving lecture)
    endAttendance: (token) => api.post('/student/attendance/end', { token }),
};