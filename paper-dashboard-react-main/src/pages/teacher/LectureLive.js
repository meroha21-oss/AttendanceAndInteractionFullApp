import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Button,
    TabContent,
    TabPane,
    Nav,
    NavItem,
    NavLink,
    Table,
    Badge,
    Form,
    FormGroup,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Alert,
    Label,
    Spinner
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import classnames from 'classnames';
import { lectureService } from '../../services/lectureService';
import { questionService } from '../../services/questionService';
import { chatService } from '../../services/chatService';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacherLectureRealtime } from '../../hooks/useRealtime';

const LectureLive = () => {
    const { lectureId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('1');
    const [lecture, setLecture] = useState(location.state?.lecture || null);
    const [attendance, setAttendance] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [publishedQuestions, setPublishedQuestions] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [questionModal, setQuestionModal] = useState(false);
    const [interactionReport, setInteractionReport] = useState(null);
    const [reportModal, setReportModal] = useState(false);
    const [questionForm, setQuestionForm] = useState({
        type: 'mcq',
        question_text: '',
        points: 1,
        options: [{ text: '', is_correct: true }, { text: '', is_correct: false }],
        correct_index: 0
    });
    const [loading, setLoading] = useState(true);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();
    const { user } = useAuth();

    // Real-time handlers
    const handleAttendanceUpdated = useCallback((data) => {
        console.log('Attendance updated:', data);
        setAttendance(prev => {
            const existing = prev.find(a => a.student?.id === data.student.id);
            if (existing) {
                return prev.map(a =>
                    a.student?.id === data.student.id
                        ? { ...a, last_seen_at: data.last_seen_at, status: 'present' }
                        : a
                );
            } else {
                return [...prev, {
                    id: data.student.id,
                    student: data.student,
                    joined_at: data.joined_at,
                    last_seen_at: data.last_seen_at,
                    status: 'present'
                }];
            }
        });
    }, []);

    const handleAnswerSubmitted = useCallback((data) => {
        enqueueSnackbar(`New answer submitted by ${data.student?.full_name || 'student'}`, { variant: 'info' });

        // Update answers count in published questions
        if (data.publication_id) {
            setPublishedQuestions(prev => prev.map(pub => {
                if (pub.id === data.publication_id) {
                    return {
                        ...pub,
                        answers: [...(pub.answers || []), data]
                    };
                }
                return pub;
            }));
        }
    }, [enqueueSnackbar]);

    const handleChatMessageSent = useCallback((data) => {
        console.log('New chat message:', data);
        setChatMessages(prev => [...prev, data.message || data]);
    }, []);

    const handleQuestionPublished = useCallback((data) => {
        console.log('Question published:', data);
        setPublishedQuestions(prev => [...prev, data]);
        enqueueSnackbar('New question published to students', { variant: 'success' });
    }, [enqueueSnackbar]);

    const handleQuestionClosed = useCallback((data) => {
        console.log('Question closed:', data);
        setPublishedQuestions(prev => prev.map(pub =>
            pub.id === data.id ? { ...pub, status: 'closed' } : pub
        ));
        enqueueSnackbar('Question closed for students', { variant: 'info' });
    }, [enqueueSnackbar]);

    // ✅ استخدم useTeacherLectureRealtime بشكل صحيح
    useTeacherLectureRealtime(lectureId, user?.id, {
        onAttendanceUpdated: handleAttendanceUpdated,
        onAnswerSubmitted: handleAnswerSubmitted,
        onChatMessageSent: handleChatMessageSent,
        onQuestionPublished: handleQuestionPublished,
        onQuestionClosed: handleQuestionClosed,
    });

    // ✅ تعريف الدوال المساعدة
    const fetchAttendance = useCallback(async () => {
        try {
            const response = await callApi(() => lectureService.getLiveAttendance(lectureId));
            setAttendance(response.data || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            setAttendance([]);
        }
    }, [callApi, lectureId]);

    // ✅ تم التصحيح هنا: استخدام questionService.getByLecture بدلاً من lectureService.getLectureQuestions
    const fetchQuestions = useCallback(async () => {
        try {
            setQuestionsLoading(true);
            console.log('Fetching questions for lecture:', lectureId);
            const response = await callApi(() => questionService.getByLecture(lectureId));
            console.log('Questions response:', response);
            if (response.data) {
                setQuestions(response.data);
            } else {
                setQuestions([]);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            setQuestions([]);
        } finally {
            setQuestionsLoading(false);
        }
    }, [callApi, lectureId]);

    // دالة جديدة لسحب الأسئلة المنشورة - سنستخدم الـ Pusher events بدلاً من API مباشر
    const fetchPublishedQuestions = useCallback(async () => {
        try {
            // إذا كان لديك endpoint للأسئلة المنشورة، استخدمه هنا:
            // const response = await callApi(() => lectureService.getPublishedQuestions(lectureId));
            // setPublishedQuestions(response.data || []);

            // حالياً، سنعتمد على Pusher events فقط
            // يمكنك إضافة منطق لحفظ الأسئلة المنشورة في localStorage للاستمرارية
            const savedQuestions = localStorage.getItem(`published_questions_${lectureId}`);
            if (savedQuestions) {
                setPublishedQuestions(JSON.parse(savedQuestions));
            }
        } catch (error) {
            console.error('Error fetching published questions:', error);
        }
    }, [callApi, lectureId]);

    const fetchChat = useCallback(async () => {
        try {
            const response = await callApi(() => chatService.getTeacherChat(lectureId));
            setChatMessages(response.data || []);
        } catch (error) {
            console.error('Error fetching chat:', error);
            setChatMessages([]);
        }
    }, [callApi, lectureId]);

    const fetchInteractionReport = useCallback(async () => {
        try {
            const response = await callApi(() => lectureService.getInteractionReport(lectureId));
            setInteractionReport(response.data);
        } catch (error) {
            console.error('Error fetching interaction report:', error);
            setInteractionReport(null);
        }
    }, [callApi, lectureId]);

    const handleEndLecture = useCallback(async () => {
        if (window.confirm('Are you sure you want to end this lecture? All students will be disconnected.')) {
            try {
                await callApi(() => lectureService.endLecture(lectureId), 'Lecture ended successfully');
                // مسح الأسئلة المنشورة المحفوظة محلياً
                localStorage.removeItem(`published_questions_${lectureId}`);
                navigate('/teacher/dashboard');
            } catch (error) {
                // Error is handled by useApi
            }
        }
    }, [callApi, lectureId, navigate]);

    const fetchLectureData = useCallback(async () => {
        try {
            setLoading(true);

            if (!lectureId || isNaN(lectureId)) {
                enqueueSnackbar('Invalid lecture ID', { variant: 'error' });
                navigate('/teacher/dashboard');
                return;
            }

            // If lecture is not in state, fetch it from today's lectures
            if (!lecture) {
                const lecturesResponse = await callApi(() => lectureService.getTeacherTodayLectures());
                const lectures = lecturesResponse.data || [];
                const foundLecture = lectures.find(l => l.id === parseInt(lectureId));

                if (!foundLecture) {
                    enqueueSnackbar('Lecture not found or not available today', { variant: 'error' });
                    navigate('/teacher/dashboard');
                    return;
                }

                setLecture(foundLecture);
            }

            // Check if lecture is running
            if (lecture?.status !== 'running') {
                enqueueSnackbar('This lecture is not currently active', { variant: 'warning' });
                navigate('/teacher/dashboard');
                return;
            }

            // Fetch initial data
            await Promise.all([
                fetchAttendance(),
                fetchQuestions(), // ✅ تم التصحيح هنا
                fetchChat(),
                fetchInteractionReport()
            ]);

        } catch (error) {
            enqueueSnackbar('Failed to load lecture data', { variant: 'error' });
            navigate('/teacher/dashboard');
        } finally {
            setLoading(false);
        }
    }, [lecture, lectureId, callApi, enqueueSnackbar, navigate, fetchAttendance, fetchQuestions, fetchChat, fetchInteractionReport]);

    useEffect(() => {
        fetchLectureData();
    }, [fetchLectureData]);

    // حفظ الأسئلة المنشورة في localStorage عند التحديث
    useEffect(() => {
        if (publishedQuestions.length > 0) {
            localStorage.setItem(`published_questions_${lectureId}`, JSON.stringify(publishedQuestions));
        }
    }, [publishedQuestions, lectureId]);

    // Auto-close expired questions
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            publishedQuestions.forEach(publication => {
                const expiresAt = new Date(publication.expires_at);
                if (expiresAt <= now && publication.status === 'published') {
                    handleCloseQuestion(publication.id);
                }
            });
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [publishedQuestions]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await callApi(() => chatService.sendTeacherMessage(lectureId, newMessage), 'Message sent');
            setNewMessage('');
            fetchChat(); // Refresh chat
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        try {
            // Format the question data based on API requirements
            const questionData = {
                lecture_id: parseInt(lectureId),
                type: questionForm.type,
                question_text: questionForm.question_text,
                points: questionForm.points,
            };

            // Add options only for MCQ and True/False
            if (questionForm.type === 'mcq' || questionForm.type === 'true_false') {
                questionData.options = questionForm.options.map(option => ({
                    text: option.text
                }));
                questionData.correct_index = questionForm.correct_index;
            }

            const response = await callApi(() => questionService.create(questionData), 'Question created successfully');

            // Add the new question to the list immediately
            if (response.data) {
                setQuestions(prev => [response.data, ...prev]);
                enqueueSnackbar('Question created successfully!', { variant: 'success' });
            }

            setQuestionModal(false);
            setQuestionForm({
                type: 'mcq',
                question_text: '',
                points: 1,
                options: [{ text: '', is_correct: true }, { text: '', is_correct: false }],
                correct_index: 0
            });

            // Optionally refresh the questions list to ensure consistency
            setTimeout(() => {
                fetchQuestions();
            }, 1000);

        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handlePublishQuestion = async (questionId) => {
        try {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes from now

            const publicationData = {
                question_id: questionId,
                lecture_id: parseInt(lectureId),
                expires_at: expiresAt.toISOString().slice(0, 19).replace('T', ' '),
            };

            // Call the API to publish the question
            const response = await callApi(() => questionService.publish(publicationData), 'Question published successfully');

            // The real publication ID will come from the response
            if (response.data && response.data.id) {
                // The question will be added to publishedQuestions via Pusher event
                // We don't need to manually add it here
            }

        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleCloseQuestion = async (publicationId) => {
        try {
            console.log('Closing publication with ID:', publicationId);
            await callApi(() => questionService.closeQuestion(publicationId), 'Question closed');
            // The question will be updated via Pusher event
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleCloseAllQuestions = async () => {
        if (window.confirm('Are you sure you want to close all active questions?')) {
            try {
                const activeQuestions = publishedQuestions.filter(q => q.status === 'published');
                for (const question of activeQuestions) {
                    await handleCloseQuestion(question.id);
                }
                enqueueSnackbar('All questions closed successfully', { variant: 'success' });
            } catch (error) {
                enqueueSnackbar('Error closing questions', { variant: 'error' });
            }
        }
    };

    const handleRepublishQuestion = async (questionId) => {
        try {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes from now

            const publicationData = {
                question_id: questionId,
                lecture_id: parseInt(lectureId),
                expires_at: expiresAt.toISOString().slice(0, 19).replace('T', ' '),
            };

            await callApi(() => questionService.publish(publicationData), 'Question republished successfully');
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const calculateTimeLeft = (expiresAt) => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const timeLeft = expires - now;

        if (timeLeft <= 0) return { minutes: 0, seconds: 0, total: 0, isExpired: true };

        return {
            minutes: Math.floor(timeLeft / (1000 * 60)),
            seconds: Math.floor((timeLeft % (1000 * 60)) / 1000),
            total: timeLeft,
            isExpired: false
        };
    };

    // ✅ الآن تم تعريف جميع الدوال

    return (
        <div className="container-fluid">
            {loading ? (
                <div className="text-center py-5">
                    <Spinner color="primary" />
                    <p>Loading lecture data...</p>
                </div>
            ) : lecture ? (
                <>
                    {/* Lecture Header */}
                    <Row className="mb-4 align-items-center">
                        <Col md="8">
                            <h2 className="mb-1">
                                {lecture.course?.code} - {lecture.course?.name}
                                {lecture.status === 'running' && (
                                    <Badge color="success" className="ml-2">
                                        <i className="ni ni-user-run mr-1"></i>
                                        LIVE
                                    </Badge>
                                )}
                            </h2>
                            <p className="text-muted mb-0">
                                Section: {lecture.section?.name} | Lecture #{lecture.lecture_no}
                            </p>
                        </Col>
                        <Col md="4" className="text-right">
                            <Button color="info" className="mr-2" onClick={() => setReportModal(true)}>
                                <i className="ni ni-chart-bar-32 mr-1"></i>
                                View Report
                            </Button>
                            <Button color="danger" onClick={handleEndLecture}>
                                <i className="ni ni-button-power mr-1"></i>
                                End Lecture
                            </Button>
                        </Col>
                    </Row>

                    {/* Tabs */}
                    <Nav tabs className="mb-3">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '1' })}
                                onClick={() => setActiveTab('1')}
                            >
                                <i className="ni ni-single-02 mr-1"></i>
                                Attendance ({attendance.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '2' })}
                                onClick={() => setActiveTab('2')}
                            >
                                <i className="ni ni-collection mr-1"></i>
                                Questions ({questions.length})
                                {questionsLoading && <Spinner size="sm" color="primary" className="ml-2" />}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '3' })}
                                onClick={() => setActiveTab('3')}
                            >
                                <i className="ni ni-chat-round mr-1"></i>
                                Chat ({chatMessages.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '4' })}
                                onClick={() => setActiveTab('4')}
                            >
                                <i className="ni ni-send mr-1"></i>
                                Published Questions ({publishedQuestions.filter(p => p.status === 'published').length})
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab}>
                        {/* Attendance Tab */}
                        <TabPane tabId="1">
                            <Row>
                                <Col>
                                    <Card>
                                        <CardBody>
                                            <CardTitle tag="h5">
                                                <i className="ni ni-single-02 mr-2"></i>
                                                Live Attendance
                                            </CardTitle>
                                            <Table responsive hover>
                                                <thead>
                                                <tr>
                                                    <th>Student ID</th>
                                                    <th>Student Name</th>
                                                    <th>Email</th>
                                                    <th>Status</th>
                                                    <th>Last Seen</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {attendance.length > 0 ? (
                                                    attendance.map((record) => (
                                                        <tr key={record.id || record.student?.id}>
                                                            <td>{record.student?.id || 'N/A'}</td>
                                                            <td>
                                                                <strong>{record.student?.full_name || 'Unknown Student'}</strong>
                                                            </td>
                                                            <td>{record.student?.email || 'N/A'}</td>
                                                            <td>
                                                                <Badge color="success">
                                                                    <i className="ni ni-check-bold mr-1"></i>
                                                                    Present
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                {record.last_seen_at ?
                                                                    new Date(record.last_seen_at).toLocaleTimeString() :
                                                                    'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center py-4">
                                                            <i className="ni ni-single-02 text-muted" style={{ fontSize: '3rem' }}></i>
                                                            <p className="mt-3 text-muted">No students have joined yet</p>
                                                        </td>
                                                    </tr>
                                                )}
                                                </tbody>
                                            </Table>
                                            <Button color="primary" size="sm" onClick={fetchAttendance}>
                                                <i className="ni ni-refresh mr-1"></i>
                                                Refresh Attendance
                                            </Button>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </TabPane>

                        {/* Questions Tab */}
                        <TabPane tabId="2">
                            <Row>
                                <Col>
                                    <Card>
                                        <CardBody>
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <CardTitle tag="h5" className="mb-0">
                                                    <i className="ni ni-collection mr-2"></i>
                                                    Question Bank ({questions.length})
                                                    {questionsLoading && <Spinner size="sm" color="primary" className="ml-2" />}
                                                </CardTitle>
                                                <div>
                                                    <Button color="info" size="sm" className="mr-2" onClick={fetchQuestions}>
                                                        <i className="ni ni-refresh mr-1"></i>
                                                        Refresh
                                                    </Button>
                                                    <Button color="primary" onClick={() => setQuestionModal(true)}>
                                                        <i className="ni ni-fat-add mr-1"></i> Create Question
                                                    </Button>
                                                </div>
                                            </div>

                                            {questionsLoading ? (
                                                <div className="text-center py-4">
                                                    <Spinner color="primary" />
                                                    <p className="mt-2">Loading questions...</p>
                                                </div>
                                            ) : questions.length > 0 ? (
                                                <div className="question-list">
                                                    {questions.map((question) => {
                                                        const isPublished = publishedQuestions.some(pq =>
                                                            pq.question_id === question.id && pq.status === 'published'
                                                        );
                                                        const wasPublished = publishedQuestions.some(pq =>
                                                            pq.question_id === question.id
                                                        );

                                                        return (
                                                            <Card key={question.id} className="mb-3 border-left-primary border-left-3">
                                                                <CardBody>
                                                                    <div className="d-flex justify-content-between align-items-start">
                                                                        <div style={{ flex: 1 }}>
                                                                            <h6>{question.question_text}</h6>
                                                                            <div className="d-flex align-items-center flex-wrap gap-2 mt-2">
                                                                                <Badge color="info">
                                                                                    {question.type?.toUpperCase()}
                                                                                </Badge>
                                                                                <Badge color="success">
                                                                                    {question.points || 0} points
                                                                                </Badge>
                                                                                <Badge color="secondary">
                                                                                    Created: {new Date(question.created_at).toLocaleDateString()}
                                                                                </Badge>
                                                                                {isPublished && (
                                                                                    <Badge color="warning">
                                                                                        <i className="ni ni-send mr-1"></i>
                                                                                        Currently Published
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            {question.options && question.options.length > 0 && (
                                                                                <div className="mt-3">
                                                                                    <h6>Options:</h6>
                                                                                    <ul className="list-unstyled mb-0">
                                                                                        {question.options.map((option, idx) => (
                                                                                            <li key={option.id || idx} className={`mb-1 ${option.is_correct ? 'text-success font-weight-bold' : ''}`}>
                                                                                                <i className={`ni ni-${option.is_correct ? 'check-bold' : 'simple-remove'} mr-2`}></i>
                                                                                                {option.option_text}
                                                                                                {option.is_correct && ' (Correct)'}
                                                                                            </li>
                                                                                        ))}
                                                                                    </ul>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="ml-3 d-flex flex-column">
                                                                            <Button
                                                                                color="warning"
                                                                                size="sm"
                                                                                onClick={() => handlePublishQuestion(question.id)}
                                                                                className="mb-2"
                                                                                disabled={isPublished}
                                                                            >
                                                                                <i className="ni ni-send mr-1"></i>
                                                                                {isPublished ? 'Currently Published' :
                                                                                    wasPublished ? 'Republish' : 'Publish'}
                                                                            </Button>

                                                                            {isPublished && (
                                                                                <Button
                                                                                    color="danger"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        const publication = publishedQuestions.find(pq =>
                                                                                            pq.question_id === question.id && pq.status === 'published'
                                                                                        );
                                                                                        if (publication) {
                                                                                            handleCloseQuestion(publication.id);
                                                                                        }
                                                                                    }}
                                                                                    className="mb-2"
                                                                                >
                                                                                    <i className="ni ni-fat-remove mr-1"></i>
                                                                                    Close
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </CardBody>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <Alert color="info">
                                                    <i className="ni ni-bulb-61 mr-2"></i>
                                                    No questions created yet. Create questions to engage with your students during the lecture.
                                                </Alert>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </TabPane>

                        {/* Chat Tab */}
                        <TabPane tabId="3">
                            <Row>
                                <Col lg="8">
                                    <Card className="h-100">
                                        <CardBody className="p-0">
                                            <div className="p-3 border-bottom">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <CardTitle tag="h6" className="mb-0">
                                                        <i className="ni ni-chat-round mr-2"></i>
                                                        Lecture Chat
                                                    </CardTitle>
                                                    <Button color="link" size="sm" onClick={fetchChat}>
                                                        <i className="ni ni-refresh mr-1"></i>
                                                        Refresh
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="p-3" style={{ height: '400px', overflowY: 'auto' }}>
                                                {chatMessages.length > 0 ? (
                                                    chatMessages.map((message) => (
                                                        <div key={message.id} className="mb-3">
                                                            <div className={`d-inline-block p-3 rounded ${message.user?.role === 'teacher' ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '80%' }}>
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <strong>{message.user?.full_name}</strong>
                                                                    <small className={message.user?.role === 'teacher' ? 'text-white-50' : 'text-muted'}>
                                                                        {new Date(message.sent_at).toLocaleTimeString([], {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </small>
                                                                </div>
                                                                <p className="mb-0">{message.message}</p>
                                                                {message.user?.role === 'student' && (
                                                                    <small className="d-block mt-1 text-muted">
                                                                        Student
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <i className="ni ni-chat-round text-muted" style={{ fontSize: '3rem' }}></i>
                                                        <p className="mt-3 text-muted">No messages yet. Start the conversation!</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col lg="4">
                                    <Card>
                                        <CardBody>
                                            <CardTitle tag="h6">
                                                <i className="ni ni-send mr-2"></i>
                                                Send Message
                                            </CardTitle>
                                            <Form onSubmit={handleSendMessage}>
                                                <FormGroup>
                                                    <Input
                                                        type="textarea"
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        placeholder="Type your message here..."
                                                        rows="4"
                                                        maxLength="500"
                                                    />
                                                    <small className="text-muted float-right">
                                                        {newMessage.length}/500 characters
                                                    </small>
                                                </FormGroup>
                                                <Button type="submit" color="primary" block disabled={!newMessage.trim()}>
                                                    <i className="ni ni-send mr-2"></i>
                                                    Send Message
                                                </Button>
                                            </Form>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </TabPane>

                        {/* Published Questions Tab */}
                        <TabPane tabId="4">
                            <Row>
                                <Col>
                                    <Card>
                                        <CardBody>
                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <CardTitle tag="h5" className="mb-0">
                                                    <i className="ni ni-send mr-2"></i>
                                                    Published Questions
                                                    <Badge color="warning" className="ml-2">
                                                        {publishedQuestions.filter(p => p.status === 'published').length} Active
                                                    </Badge>
                                                </CardTitle>
                                                <div>
                                                    <Button color="info" size="sm" className="mr-2" onClick={fetchPublishedQuestions}>
                                                        <i className="ni ni-refresh mr-1"></i>
                                                        Refresh
                                                    </Button>
                                                    <Button
                                                        color="danger"
                                                        size="sm"
                                                        onClick={handleCloseAllQuestions}
                                                        disabled={publishedQuestions.filter(p => p.status === 'published').length === 0}
                                                    >
                                                        <i className="ni ni-fat-remove mr-1"></i>
                                                        Close All
                                                    </Button>
                                                </div>
                                            </div>

                                            {publishedQuestions.length > 0 ? (
                                                publishedQuestions.map((publication) => {
                                                    const question = publication.question;
                                                    const timeLeft = calculateTimeLeft(publication.expires_at);
                                                    const isActive = publication.status === 'published' && !timeLeft.isExpired;

                                                    return (
                                                        <Card key={publication.id} className={`mb-3 border-left-${isActive ? 'warning' : 'secondary'} border-left-3`}>
                                                            <CardBody>
                                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                                    <div style={{ flex: 1 }}>
                                                                        <h5>{question?.question_text}</h5>
                                                                        <div className="d-flex align-items-center flex-wrap gap-2 mt-2">
                                                                            <Badge color="info">
                                                                                {question?.type?.toUpperCase()}
                                                                            </Badge>
                                                                            <Badge color="success">
                                                                                {question?.points || 0} points
                                                                            </Badge>
                                                                            <Badge color={isActive ? "warning" : "secondary"}>
                                                                                {publication.status === 'closed'
                                                                                    ? 'Closed'
                                                                                    : timeLeft.isExpired
                                                                                        ? 'Expired'
                                                                                        : `${timeLeft.minutes}:${String(timeLeft.seconds).padStart(2, '0')} remaining`
                                                                                }
                                                                            </Badge>
                                                                            <Badge color="light" className="text-dark">
                                                                                Published: {new Date(publication.published_at).toLocaleTimeString()}
                                                                            </Badge>
                                                                            <Badge color="light" className="text-dark">
                                                                                Expires: {new Date(publication.expires_at).toLocaleTimeString()}
                                                                            </Badge>
                                                                        </div>

                                                                        {/* Show answers count */}
                                                                        <div className="mt-3">
                                                                            <Badge color="info">
                                                                                <i className="ni ni-single-copy-04 mr-1"></i>
                                                                                {publication.answers?.length || 0} answers received
                                                                            </Badge>
                                                                        </div>

                                                                        {/* Show question options */}
                                                                        {question?.options && question.options.length > 0 && (
                                                                            <div className="mt-3">
                                                                                <h6>Options:</h6>
                                                                                <ul className="list-unstyled mb-0">
                                                                                    {question.options.map((option, idx) => (
                                                                                        <li
                                                                                            key={option.id || idx}
                                                                                            className={`mb-1 ${option.is_correct ? 'text-success font-weight-bold' : ''}`}
                                                                                        >
                                                                                            <i className={`ni ni-${option.is_correct ? 'check-bold' : 'simple-remove'} mr-2`}></i>
                                                                                            {option.option_text}
                                                                                            {option.is_correct && ' (Correct)'}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="ml-3 d-flex flex-column align-items-end">
                                                                        {isActive ? (
                                                                            <Button
                                                                                color="danger"
                                                                                size="sm"
                                                                                onClick={() => handleCloseQuestion(publication.id)}
                                                                                className="mb-2"
                                                                                block
                                                                            >
                                                                                <i className="ni ni-fat-remove mr-1"></i>
                                                                                Close Now
                                                                            </Button>
                                                                        ) : (
                                                                            <Badge color="secondary" className="p-2 mb-2">
                                                                                {publication.status === 'closed' ? 'Closed' : 'Expired'}
                                                                            </Badge>
                                                                        )}

                                                                        {/* Republish button for closed/expired questions */}
                                                                        {!isActive && (
                                                                            <Button
                                                                                color="primary"
                                                                                size="sm"
                                                                                onClick={() => handleRepublishQuestion(question.id)}
                                                                                className="mb-2"
                                                                                block
                                                                            >
                                                                                <i className="ni ni-refresh mr-1"></i>
                                                                                Republish
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    );
                                                })
                                            ) : (
                                                <Alert color="info">
                                                    <i className="ni ni-bulb-61 mr-2"></i>
                                                    No published questions yet. Publish a question from the Questions tab.
                                                </Alert>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </TabPane>
                    </TabContent>

                    {/* Create Question Modal */}
                    <Modal isOpen={questionModal} toggle={() => setQuestionModal(!questionModal)} size="lg">
                        <ModalHeader toggle={() => setQuestionModal(!questionModal)}>
                            <i className="ni ni-fat-add mr-2"></i>
                            Create New Question
                        </ModalHeader>
                        <Form onSubmit={handleCreateQuestion}>
                            <ModalBody>
                                <FormGroup>
                                    <Label>Question Type</Label>
                                    <Input
                                        type="select"
                                        value={questionForm.type}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            let newOptions = [];
                                            let correctIndex = 0;

                                            if (newType === 'true_false') {
                                                newOptions = [
                                                    { text: 'True', is_correct: true },
                                                    { text: 'False', is_correct: false }
                                                ];
                                            } else if (newType === 'mcq') {
                                                newOptions = [
                                                    { text: '', is_correct: true },
                                                    { text: '', is_correct: false },
                                                    { text: '', is_correct: false }
                                                ];
                                                correctIndex = 0;
                                            } else if (newType === 'short') {
                                                newOptions = [];
                                            }
                                            setQuestionForm({
                                                ...questionForm,
                                                type: newType,
                                                options: newOptions,
                                                correct_index: correctIndex
                                            });
                                        }}
                                    >
                                        <option value="mcq">Multiple Choice (MCQ)</option>
                                        <option value="true_false">True/False</option>
                                        <option value="short">Short Answer</option>
                                    </Input>
                                </FormGroup>

                                <FormGroup>
                                    <Label>Question Text</Label>
                                    <Input
                                        type="textarea"
                                        value={questionForm.question_text}
                                        onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                        placeholder="Enter your question..."
                                        rows="3"
                                        required
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label>Points</Label>
                                    <Input
                                        type="number"
                                        value={questionForm.points}
                                        onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                                        min="1"
                                        max="10"
                                        required
                                    />
                                </FormGroup>

                                {(questionForm.type === 'mcq' || questionForm.type === 'true_false') && (
                                    <>
                                        <Label>Options</Label>
                                        {questionForm.options.map((option, index) => (
                                            <FormGroup key={index} className="d-flex align-items-center mb-2">
                                                <Input
                                                    type="text"
                                                    value={option.text}
                                                    onChange={(e) => {
                                                        const newOptions = [...questionForm.options];
                                                        newOptions[index].text = e.target.value;
                                                        setQuestionForm({ ...questionForm, options: newOptions });
                                                    }}
                                                    placeholder={`Option ${index + 1}`}
                                                    className="mr-2"
                                                    required
                                                    disabled={questionForm.type === 'true_false' && index < 2}
                                                />
                                                <FormGroup check className="mr-2">
                                                    <Label check>
                                                        <Input
                                                            type="radio"
                                                            name="correct_option"
                                                            checked={index === questionForm.correct_index}
                                                            onChange={() => setQuestionForm({ ...questionForm, correct_index: index })}
                                                        />{' '}
                                                        Correct
                                                    </Label>
                                                </FormGroup>
                                                {questionForm.type === 'mcq' && questionForm.options.length > 2 && (
                                                    <Button
                                                        color="danger"
                                                        size="sm"
                                                        onClick={() => {
                                                            const newOptions = questionForm.options.filter((_, i) => i !== index);
                                                            setQuestionForm({
                                                                ...questionForm,
                                                                options: newOptions,
                                                                correct_index: questionForm.correct_index >= index ?
                                                                    Math.max(0, questionForm.correct_index - 1) :
                                                                    questionForm.correct_index
                                                            });
                                                        }}
                                                    >
                                                        <i className="ni ni-fat-remove"></i>
                                                    </Button>
                                                )}
                                            </FormGroup>
                                        ))}
                                        {questionForm.type === 'mcq' && (
                                            <Button
                                                color="link"
                                                onClick={() => {
                                                    setQuestionForm({
                                                        ...questionForm,
                                                        options: [...questionForm.options, { text: '', is_correct: false }]
                                                    });
                                                }}
                                                className="p-0"
                                            >
                                                <i className="ni ni-fat-add mr-1"></i> Add Another Option
                                            </Button>
                                        )}
                                    </>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button type="submit" color="primary">
                                    <i className="ni ni-check-bold mr-1"></i>
                                    Create Question
                                </Button>
                                <Button color="secondary" onClick={() => setQuestionModal(false)}>
                                    <i className="ni ni-fat-remove mr-1"></i>
                                    Cancel
                                </Button>
                            </ModalFooter>
                        </Form>
                    </Modal>

                    {/* Interaction Report Modal */}
                    <Modal isOpen={reportModal} toggle={() => setReportModal(!reportModal)} size="lg">
                        <ModalHeader toggle={() => setReportModal(!reportModal)}>
                            <i className="ni ni-chart-bar-32 mr-2"></i>
                            Interaction Report
                        </ModalHeader>
                        <ModalBody>
                            {interactionReport ? (
                                <div>
                                    <Card className="mb-4">
                                        <CardBody>
                                            <CardTitle tag="h5">Summary</CardTitle>
                                            <Row>
                                                <Col md="4">
                                                    <div className="text-center">
                                                        <h2 className="text-primary">{interactionReport.summary.publications_count}</h2>
                                                        <p className="text-muted mb-0">Questions Published</p>
                                                    </div>
                                                </Col>
                                                <Col md="4">
                                                    <div className="text-center">
                                                        <h2 className="text-success">{interactionReport.summary.answers_count}</h2>
                                                        <p className="text-muted mb-0">Total Answers</p>
                                                    </div>
                                                </Col>
                                                <Col md="4">
                                                    <div className="text-center">
                                                        <h2 className="text-warning">{interactionReport.summary.total_score_awarded}</h2>
                                                        <p className="text-muted mb-0">Total Points Awarded</p>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>

                                    <Card>
                                        <CardBody>
                                            <CardTitle tag="h5">Student Performance</CardTitle>
                                            {interactionReport.by_student && interactionReport.by_student.length > 0 ? (
                                                <Table responsive>
                                                    <thead>
                                                    <tr>
                                                        <th>Student</th>
                                                        <th>Questions Attempted</th>
                                                        <th>Correct Answers</th>
                                                        <th>Total Points</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {interactionReport.by_student.map((student, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                <strong>{student.student_name}</strong>
                                                                <br/>
                                                                <small className="text-muted">{student.student_id}</small>
                                                            </td>
                                                            <td>{student.questions_attempted}</td>
                                                            <td>{student.correct_answers}</td>
                                                            <td>
                                                                <Badge color="success">{student.total_points}</Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <Alert color="info">
                                                    <i className="ni ni-bulb-61 mr-2"></i>
                                                    No student interaction data available yet.
                                                </Alert>
                                            )}
                                        </CardBody>
                                    </Card>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <Spinner color="primary" />
                                    <p className="mt-3">Loading report...</p>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={() => setReportModal(false)}>
                                Close
                            </Button>
                        </ModalFooter>
                    </Modal>
                </>
            ) : (
                <Alert color="danger">
                    <h4>Lecture not found</h4>
                    <Button color="primary" onClick={() => navigate('/teacher/dashboard')}>
                        Return to Dashboard
                    </Button>
                </Alert>
            )}
        </div>
    );
};

export default LectureLive;