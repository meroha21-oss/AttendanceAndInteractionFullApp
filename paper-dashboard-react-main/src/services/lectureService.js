import api from './api';

export const lectureService = {
    // ============ Teacher APIs ============
    getTeacherWeekLectures: () => api.get('/teacher/lectures/week'),

    getTeacherTodayLectures: () => api.get('/teacher/lectures/today'),

    getById: (lectureId) => api.get(`/teacher/lectures/${lectureId}`),

    startLecture: (lectureId) => api.post(`/teacher/lectures/${lectureId}/start`),

    endLecture: (lectureId) => api.post(`/teacher/lectures/${lectureId}/end`),
    leaveLecture:(lectureId) => api.post(`/student/lectures/${lectureId}/leave`),

    getLiveAttendance: (lectureId) => api.get(`/teacher/lectures/${lectureId}/attendance-live`),

    getActiveQuestions: (lectureId) => api.get(`/teacher/lectures/${lectureId}/active-questions`),

    getInteractionReport: (lectureId) => api.get(`/teacher/lectures/${lectureId}/interaction-report`),

    // ============ Student APIs ============
    getStudentWeekLectures: () => api.get('/student/lectures/week'),

    getStudentTodayLectures: () => api.get('/student/lectures/today'),

    getStudentActiveQuestions: (lectureId) => api.get(`/student/lectures/${lectureId}/active-questions`),

    getAttendanceToken: (lectureId) => api.post('/student/attendance/token', { lecture_id: lectureId }),

    sendHeartbeat: (token) => api.post('/student/attendance/heartbeat', { token }),
    getPastLectures: () => {
        return api.get('/teacher/lectures/past');
    },

    getPastLectureById: (lectureId) => {
        return api.get(`/teacher/lectures/past/${lectureId}`);
    },
};