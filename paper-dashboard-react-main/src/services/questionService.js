import api from './api';

export const questionService = {
    // Teacher APIs
    create: (questionData) => api.post('/teacher/questions', questionData),

    getByLecture: (lectureId) => api.get(`/teacher/lectures/${lectureId}/questions`),

    publish: (publicationData) => api.post('/teacher/questions/publish', publicationData),

    closeQuestion: (publicationId) => api.post(`/teacher/publications/${publicationId}/close`),


    submitAnswer: (answerData) => api.post('/student/answers', answerData),

};