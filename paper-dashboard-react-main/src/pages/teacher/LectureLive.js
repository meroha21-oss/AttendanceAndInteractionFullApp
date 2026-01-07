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
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();
    const { user } = useAuth();

    // ==================== Real-time Handlers ====================
    const handleAttendanceUpdated = useCallback((data) => {
        console.log('✅ Attendance updated:', data);

        setAttendance(prev => {
            const existingIndex = prev.findIndex(a => a.student?.id === data.student.id);

            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    last_seen_at: data.last_seen_at || new Date().toISOString(),
                    status: 'present',
                    student: data.student || updated[existingIndex].student
                };
                return updated;
            } else {
                return [...prev, {
                    id: data.student.id,
                    student: data.student,
                    joined_at: data.joined_at || new Date().toISOString(),
                    last_seen_at: data.last_seen_at || new Date().toISOString(),
                    status: 'present'
                }];
            }
        });
    }, []);

    const handleAnswerSubmitted = useCallback((data) => {
        console.log('✅ Answer submitted:', data);

        enqueueSnackbar(`إجابة جديدة من ${data.student?.full_name || 'طالب'}`, {
            variant: 'info',
            autoHideDuration: 3000,
            anchorOrigin: { vertical: 'top', horizontal: 'left' }
        });

        // Update published questions with the answer
        if (data.publication_id) {
            setPublishedQuestions(prev => prev.map(pub => {
                if (pub.id === data.publication_id) {
                    const existingAnswer = pub.answers?.find(a =>
                        a.student_id === data.student_id && a.publication_id === data.publication_id
                    );

                    if (existingAnswer) {
                        return pub;
                    }

                    return {
                        ...pub,
                        answers: [...(pub.answers || []), {
                            ...data,
                            submitted_at: data.submitted_at || new Date().toISOString()
                        }]
                    };
                }
                return pub;
            }));
        }
    }, [enqueueSnackbar]);

    const handleChatMessageSent = useCallback((data) => {
        console.log('✅ Chat message:', data);

        setChatMessages(prev => {
            // Avoid duplicate messages
            const messageId = data.message?.id || data.id;
            const exists = prev.find(m => m.id === messageId);

            if (exists) return prev;

            const newMessage = {
                ...(data.message || data),
                user: data.user || data.message?.user || { full_name: 'Unknown', role: 'student' },
                sent_at: data.sent_at || data.message?.sent_at || new Date().toISOString(),
                id: messageId || `msg-${Date.now()}`
            };

            return [...prev, newMessage];
        });
    }, []);

    const handleQuestionPublished = useCallback((data) => {
        console.log('✅ Question published:', data);

        // Check if data has the expected structure
        if (!data) return;

        // Extract publication ID from the data
        let publicationId = null;
        let questionData = null;

        // Handle different possible data structures
        if (data.publication_id) {
            publicationId = data.publication_id;
            questionData = data;
        } else if (data.id && !data.id.toString().startsWith('pub-')) {
            // Only use the id if it's not a temporary ID
            publicationId = data.id;
            questionData = data;
        } else if (data.publication) {
            publicationId = data.publication.id;
            questionData = data.publication;
        }

        if (!publicationId) {
            console.error('❌ No valid publication ID found in question data:', data);
            return;
        }

        const newPublication = {
            id: publicationId,
            publication_id: publicationId,
            question_id: data.question_id || questionData?.question_id,
            status: 'published',
            published_at: data.published_at || questionData?.published_at || new Date().toISOString(),
            expires_at: data.expires_at || questionData?.expires_at || new Date(Date.now() + 5 * 60000).toISOString(),
            // Extract question data
            question: data.question || questionData?.question || {
                id: data.question_id || questionData?.question_id,
                question_text: data.question_text || questionData?.question_text || 'Question text not available',
                type: data.type || questionData?.type || 'mcq',
                points: data.points || questionData?.points || 1,
                options: data.options || questionData?.options || []
            },
            answers: data.answers || []
        };

        console.log('🔄 Processed publication for state:', newPublication);

        setPublishedQuestions(prev => {
            // Avoid duplicates by checking publication_id
            const exists = prev.find(p =>
                p.publication_id === newPublication.publication_id
            );

            if (exists) {
                console.log('📝 Updating existing publication');
                return prev.map(p =>
                    p.publication_id === newPublication.publication_id ? newPublication : p
                );
            }

            enqueueSnackbar('تم نشر سؤال جديد للطلاب', {
                variant: 'success',
                autoHideDuration: 3000,
                anchorOrigin: { vertical: 'top', horizontal: 'left' }
            });

            console.log('➕ Adding new publication to state');
            return [newPublication, ...prev];
        });
    }, [enqueueSnackbar]);

    const handleQuestionClosed = useCallback((data) => {
        console.log('✅ Question closed:', data);

        // Extract publication ID from data
        let publicationId = null;

        if (data.publication_id) {
            publicationId = data.publication_id;
        } else if (data.id && !data.id.toString().startsWith('pub-')) {
            publicationId = data.id;
        } else if (data.publication) {
            publicationId = data.publication.id;
        }

        if (!publicationId) {
            console.error('❌ No publication ID found in close data:', data);
            return;
        }

        setPublishedQuestions(prev => prev.map(pub => {
            if (pub.publication_id === publicationId) {
                return {
                    ...pub,
                    status: 'closed',
                    closed_at: data.closed_at || new Date().toISOString()
                };
            }
            return pub;
        }));

        enqueueSnackbar('تم إغلاق السؤال', {
            variant: 'info',
            autoHideDuration: 3000,
            anchorOrigin: { vertical: 'top', horizontal: 'left' }
        });
    }, [enqueueSnackbar]);

    const handleStudentJoined = useCallback((data) => {
        console.log('🎓 Student joined:', data);

        setAttendance(prev => {
            const existing = prev.find(a => a.student?.id === data.student.id);
            if (!existing) {
                return [...prev, {
                    id: data.student.id,
                    student: data.student,
                    joined_at: data.joined_at || new Date().toISOString(),
                    last_seen_at: new Date().toISOString(),
                    status: 'present'
                }];
            }
            return prev;
        });

        enqueueSnackbar(`انضم ${data.student?.full_name || 'طالب'} إلى المحاضرة`, {
            variant: 'success',
            autoHideDuration: 2000,
            anchorOrigin: { vertical: 'top', horizontal: 'left' }
        });
    }, [enqueueSnackbar]);

    const handleStudentLeft = useCallback((data) => {
        console.log('🚪 Student left:', data);

        setAttendance(prev => prev.map(record => {
            if (record.student?.id === data.student.id) {
                return {
                    ...record,
                    status: 'left',
                    left_at: new Date().toISOString()
                };
            }
            return record;
        }));

        enqueueSnackbar(`غادر ${data.student?.full_name || 'طالب'} المحاضرة`, {
            variant: 'warning',
            autoHideDuration: 2000,
            anchorOrigin: { vertical: 'top', horizontal: 'left' }
        });
    }, [enqueueSnackbar]);

    const handleLectureEnded = useCallback((data) => {
        console.log('🏁 Lecture ended:', data);

        enqueueSnackbar('تم إنهاء المحاضرة', {
            variant: 'warning',
            autoHideDuration: 5000,
            anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });

        localStorage.removeItem(`published_questions_${lectureId}`);

        setTimeout(() => {
            navigate('/teacher/dashboard');
        }, 3000);
    }, [enqueueSnackbar, lectureId, navigate]);

    const handleRealtimeConnected = useCallback((status) => {
        console.log('📡 Real-time connection status:', status);
        setConnectionStatus(status);
    }, []);

    const handleRealtimeError = useCallback((error) => {
        console.error('❌ Real-time error:', error);
        setConnectionStatus('error');
        enqueueSnackbar('خطأ في الاتصال المباشر', { variant: 'error' });
    }, [enqueueSnackbar]);

    // ==================== Real-time Hook ====================
    useTeacherLectureRealtime(lectureId, user?.id, {
        onAttendanceUpdated: handleAttendanceUpdated,
        onAnswerSubmitted: handleAnswerSubmitted,
        onChatMessageSent: handleChatMessageSent,
        onQuestionPublished: handleQuestionPublished,
        onQuestionClosed: handleQuestionClosed,
        onStudentJoined: handleStudentJoined,
        onStudentLeft: handleStudentLeft,
        onLectureEnded: handleLectureEnded,
        onRealtimeConnected: handleRealtimeConnected,
        onRealtimeError: handleRealtimeError
    });

    // ==================== API Functions ====================
    const fetchAttendance = useCallback(async () => {
        try {
            const response = await callApi(() => lectureService.getLiveAttendance(lectureId));
            setAttendance(response.data || []);
        } catch (error) {
            console.error('❌ Error fetching attendance:', error);
            setAttendance([]);
        }
    }, [callApi, lectureId]);

    const fetchQuestions = useCallback(async () => {
        try {
            setQuestionsLoading(true);
            const response = await callApi(() => questionService.getByLecture(lectureId));

            if (response.data) {
                setQuestions(response.data);
            } else {
                setQuestions([]);
            }
        } catch (error) {
            console.error('❌ Error fetching questions:', error);
            setQuestions([]);
        } finally {
            setQuestionsLoading(false);
        }
    }, [callApi, lectureId]);

    const fetchPublishedQuestions = useCallback(async () => {
        try {
            const response = await callApi(() => lectureService.getPublishedQuestions(lectureId));
            if (response.data) {
                // Transform the response to ensure we have proper IDs
                const transformedData = response.data.map(item => ({
                    id: item.id,
                    publication_id: item.id, // Ensure publication_id is set to the actual ID
                    question_id: item.question_id,
                    status: item.status || 'published',
                    published_at: item.published_at,
                    expires_at: item.expires_at,
                    question: item.question || {
                        id: item.question_id,
                        question_text: item.question_text,
                        type: item.type,
                        points: item.points,
                        options: item.options || []
                    },
                    answers: item.answers || []
                }));

                setPublishedQuestions(transformedData);
                localStorage.setItem(`published_questions_${lectureId}`, JSON.stringify(transformedData));
            } else {
                const savedQuestions = localStorage.getItem(`published_questions_${lectureId}`);
                if (savedQuestions) {
                    setPublishedQuestions(JSON.parse(savedQuestions));
                }
            }
        } catch (error) {
            console.error('❌ Error fetching published questions:', error);
            const savedQuestions = localStorage.getItem(`published_questions_${lectureId}`);
            if (savedQuestions) {
                setPublishedQuestions(JSON.parse(savedQuestions));
            }
        }
    }, [callApi, lectureId]);

    const fetchChat = useCallback(async () => {
        try {
            const response = await callApi(() => chatService.getTeacherChat(lectureId));
            setChatMessages(response.data || []);
        } catch (error) {
            console.error('❌ Error fetching chat:', error);
            setChatMessages([]);
        }
    }, [callApi, lectureId]);

    const fetchInteractionReport = useCallback(async () => {
        try {
            const response = await callApi(() => lectureService.getInteractionReport(lectureId));
            setInteractionReport(response.data);
        } catch (error) {
            console.error('❌ Error fetching interaction report:', error);
            setInteractionReport(null);
        }
    }, [callApi, lectureId]);

    const handleEndLecture = useCallback(async () => {
        if (window.confirm('هل أنت متأكد من إنهاء المحاضرة؟ سيتم فصل جميع الطلاب.')) {
            try {
                await callApi(() => lectureService.endLecture(lectureId), 'تم إنهاء المحاضرة بنجاح');
                localStorage.removeItem(`published_questions_${lectureId}`);

                setTimeout(() => {
                    navigate('/teacher/dashboard');
                }, 1000);
            } catch (error) {
                // Error is handled by useApi
            }
        }
    }, [callApi, lectureId, navigate]);

    // ==================== Initial Data Fetch ====================
    const fetchLectureData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🚀 Fetching lecture data for ID:', lectureId);

            if (!lectureId || isNaN(lectureId)) {
                enqueueSnackbar('معرّف المحاضرة غير صالح', { variant: 'error' });
                navigate('/teacher/dashboard');
                return;
            }

            if (!lecture) {
                const lecturesResponse = await callApi(() => lectureService.getTeacherTodayLectures());
                const lectures = lecturesResponse.data || [];
                const foundLecture = lectures.find(l => l.id === parseInt(lectureId));

                if (!foundLecture) {
                    enqueueSnackbar('المحاضرة غير موجودة أو غير متاحة اليوم', { variant: 'error' });
                    navigate('/teacher/dashboard');
                    return;
                }

                setLecture(foundLecture);
            }

            if (lecture?.status !== 'running') {
                enqueueSnackbar('هذه المحاضرة غير نشطة حالياً', { variant: 'warning' });
                navigate('/teacher/dashboard');
                return;
            }

            await Promise.all([
                fetchAttendance(),
                fetchQuestions(),
                fetchPublishedQuestions(),
                fetchChat(),
                fetchInteractionReport()
            ]);

            console.log('✅ All initial data fetched successfully');

        } catch (error) {
            console.error('❌ Failed to load lecture data:', error);
            enqueueSnackbar('فشل تحميل بيانات المحاضرة', { variant: 'error' });
            navigate('/teacher/dashboard');
        } finally {
            setLoading(false);
        }
    }, [lecture, lectureId, callApi, enqueueSnackbar, navigate, fetchAttendance, fetchQuestions, fetchPublishedQuestions, fetchChat, fetchInteractionReport]);

    useEffect(() => {
        fetchLectureData();
    }, [fetchLectureData]);

    // ==================== Auto-save & Auto-close ====================
    useEffect(() => {
        if (publishedQuestions.length > 0) {
            localStorage.setItem(`published_questions_${lectureId}`, JSON.stringify(publishedQuestions));
        }
    }, [publishedQuestions, lectureId]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const updatedQuestions = publishedQuestions.map(publication => {
                if (publication.status === 'published') {
                    const expiresAt = new Date(publication.expires_at);
                    if (expiresAt <= now) {
                        return { ...publication, status: 'expired' };
                    }
                }
                return publication;
            });

            setPublishedQuestions(updatedQuestions);
        }, 30000);

        return () => clearInterval(interval);
    }, [publishedQuestions]);

    // ==================== Event Handlers ====================
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await callApi(() => chatService.sendTeacherMessage(lectureId, newMessage), 'تم إرسال الرسالة');
            setNewMessage('');
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        try {
            const questionData = {
                lecture_id: parseInt(lectureId),
                type: questionForm.type,
                question_text: questionForm.question_text,
                points: questionForm.points,
            };

            if (questionForm.type === 'mcq' || questionForm.type === 'true_false') {
                questionData.options = questionForm.options.map(option => ({
                    text: option.text,
                    is_correct: option.is_correct || false
                }));
                questionData.correct_index = questionForm.correct_index;
            }

            const response = await callApi(() => questionService.create(questionData), 'تم إنشاء السؤال بنجاح');

            if (response.data) {
                setQuestions(prev => [response.data, ...prev]);
                enqueueSnackbar('تم إنشاء السؤال بنجاح!', { variant: 'success' });
            }

            setQuestionModal(false);
            setQuestionForm({
                type: 'mcq',
                question_text: '',
                points: 1,
                options: [{ text: '', is_correct: true }, { text: '', is_correct: false }],
                correct_index: 0
            });

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
            expiresAt.setMinutes(expiresAt.getMinutes() + 5);

            const publicationData = {
                question_id: questionId,
                lecture_id: parseInt(lectureId),
                expires_at: expiresAt.toISOString(),
            };

            console.log('📤 Publishing question:', publicationData);

            await callApi(() => questionService.publish(publicationData), 'تم نشر السؤال للطلاب');

        } catch (error) {
            console.error('❌ Error publishing question:', error);
        }
    };

    const handleCloseQuestion = async (publicationId) => {
        try {
            console.log('🔒 Closing question with publication ID:', publicationId);

            // Make sure publicationId is a number, not a string like "pub-123"
            const numericPublicationId = parseInt(publicationId);
            if (isNaN(numericPublicationId)) {
                enqueueSnackbar('معرّف النشر غير صالح', { variant: 'error' });
                return;
            }

            await callApi(() => questionService.closeQuestion(numericPublicationId), 'تم إغلاق السؤال');

            // Update the question status locally immediately
            setPublishedQuestions(prev => prev.map(pub => {
                if (pub.publication_id === numericPublicationId || pub.id === numericPublicationId) {
                    return {
                        ...pub,
                        status: 'closed',
                        closed_at: new Date().toISOString()
                    };
                }
                return pub;
            }));

        } catch (error) {
            console.error('❌ Error closing question:', error);
        }
    };

    const handleCloseAllQuestions = async () => {
        if (window.confirm('هل أنت متأكد من إغلاق جميع الأسئلة النشطة؟')) {
            try {
                const activeQuestions = publishedQuestions.filter(q => q.status === 'published');
                for (const question of activeQuestions) {
                    const publicationId = question.publication_id || question.id;
                    if (publicationId) {
                        await handleCloseQuestion(publicationId);
                    }
                }
                enqueueSnackbar('تم إغلاق جميع الأسئلة بنجاح', { variant: 'success' });
            } catch (error) {
                enqueueSnackbar('خطأ في إغلاق الأسئلة', { variant: 'error' });
            }
        }
    };

    const handleRepublishQuestion = async (questionId) => {
        try {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 5);

            const publicationData = {
                question_id: questionId,
                lecture_id: parseInt(lectureId),
                expires_at: expiresAt.toISOString(),
            };

            await callApi(() => questionService.publish(publicationData), 'تم إعادة نشر السؤال بنجاح');
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

    const getConnectionStatusColor = () => {
        switch(connectionStatus) {
            case 'connected': return 'success';
            case 'connecting': return 'warning';
            case 'disconnected': return 'danger';
            default: return 'secondary';
        }
    };

    const getConnectionStatusText = () => {
        switch(connectionStatus) {
            case 'connected': return 'متصل';
            case 'connecting': return 'جاري الاتصال...';
            case 'disconnected': return 'غير متصل';
            default: return 'غير معروف';
        }
    };

    // ==================== Render ====================
    return (
        <div className="container-fluid">
            {loading ? (
                <div className="text-center py-5">
                    <Spinner color="primary" />
                    <p className="mt-2">جاري تحميل بيانات المحاضرة...</p>
                </div>
            ) : lecture ? (
                <>
                    {/* Lecture Header */}
                    <Row className="mb-4 align-items-center">
                        <Col md="6">
                            <h2 className="mb-1">
                                {lecture.course?.code} - {lecture.course?.name}
                                {lecture.status === 'running' && (
                                    <Badge color="success" className="mr-2" pill>
                                        <i className="ni ni-user-run mr-1"></i>
                                        مباشر
                                    </Badge>
                                )}
                            </h2>
                            <p className="text-muted mb-0">
                                الشعبة: {lecture.section?.name} | المحاضرة #{lecture.lecture_no}
                            </p>
                            <div className="mt-2">
                                <Badge color={getConnectionStatusColor()} className="mr-2" pill>
                                    <i className={`ni ni-${connectionStatus === 'connected' ? 'spaceship' : 'watch-time'} mr-1`}></i>
                                    {getConnectionStatusText()}
                                </Badge>
                            </div>
                        </Col>
                        <Col md="6" className="text-left">
                            <Button color="info" className="mr-2" onClick={() => setReportModal(true)}>
                                <i className="ni ni-chart-bar-32 mr-1"></i>
                                عرض التقرير
                            </Button>
                            <Button color="danger" onClick={handleEndLecture}>
                                <i className="ni ni-button-power mr-1"></i>
                                إنهاء المحاضرة
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
                                الحضور ({attendance.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '2' })}
                                onClick={() => setActiveTab('2')}
                            >
                                <i className="ni ni-collection mr-1"></i>
                                الأسئلة ({questions.length})
                                {questionsLoading && <Spinner size="sm" color="primary" className="mr-2" />}
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '3' })}
                                onClick={() => setActiveTab('3')}
                            >
                                <i className="ni ni-chat-round mr-1"></i>
                                المحادثة ({chatMessages.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '4' })}
                                onClick={() => setActiveTab('4')}
                            >
                                <i className="ni ni-send mr-1"></i>
                                الأسئلة المنشورة ({publishedQuestions.filter(p => p.status === 'published').length})
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
                                                الحضور المباشر
                                            </CardTitle>
                                            <Table responsive hover>
                                                <thead>
                                                <tr>
                                                    <th>الرقم الجامعي</th>
                                                    <th>اسم الطالب</th>
                                                    <th>البريد الإلكتروني</th>
                                                    <th>الحالة</th>
                                                    <th>آخر ظهور</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {attendance.length > 0 ? (
                                                    attendance.map((record) => (
                                                        <tr key={record.id || record.student?.id}>
                                                            <td>{record.student?.id || 'N/A'}</td>
                                                            <td>
                                                                <strong>{record.student?.full_name || 'طالب غير معروف'}</strong>
                                                            </td>
                                                            <td>{record.student?.email || 'N/A'}</td>
                                                            <td>
                                                                <Badge color="success">
                                                                    <i className="ni ni-check-bold mr-1"></i>
                                                                    حاضر
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                {record.last_seen_at ?
                                                                    new Date(record.last_seen_at).toLocaleTimeString('ar-SA') :
                                                                    'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="text-center py-4">
                                                            <i className="ni ni-single-02 text-muted" style={{ fontSize: '3rem' }}></i>
                                                            <p className="mt-3 text-muted">لم ينضم أي طالب بعد</p>
                                                        </td>
                                                    </tr>
                                                )}
                                                </tbody>
                                            </Table>
                                            <Button color="primary" size="sm" onClick={fetchAttendance}>
                                                <i className="ni ni-refresh mr-1"></i>
                                                تحديث الحضور
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
                                                    بنك الأسئلة ({questions.length})
                                                    {questionsLoading && <Spinner size="sm" color="primary" className="mr-2" />}
                                                </CardTitle>
                                                <div>
                                                    <Button color="info" size="sm" className="mr-2" onClick={fetchQuestions}>
                                                        <i className="ni ni-refresh mr-1"></i>
                                                        تحديث
                                                    </Button>
                                                    <Button color="primary" onClick={() => setQuestionModal(true)}>
                                                        <i className="ni ni-fat-add mr-1"></i> إنشاء سؤال
                                                    </Button>
                                                </div>
                                            </div>

                                            {questionsLoading ? (
                                                <div className="text-center py-4">
                                                    <Spinner color="primary" />
                                                    <p className="mt-2">جاري تحميل الأسئلة...</p>
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
                                                                                    {question.type === 'mcq' ? 'اختيار متعدد' :
                                                                                        question.type === 'true_false' ? 'صح/خطأ' :
                                                                                            'إجابة قصيرة'}
                                                                                </Badge>
                                                                                <Badge color="success">
                                                                                    {question.points || 0} نقطة
                                                                                </Badge>
                                                                                <Badge color="secondary">
                                                                                    أنشئت: {new Date(question.created_at).toLocaleDateString('ar-SA')}
                                                                                </Badge>
                                                                                {isPublished && (
                                                                                    <Badge color="warning">
                                                                                        <i className="ni ni-send mr-1"></i>
                                                                                        منشور حالياً
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            {question.options && question.options.length > 0 && (
                                                                                <div className="mt-3">
                                                                                    <h6>الخيارات:</h6>
                                                                                    <ul className="list-unstyled mb-0">
                                                                                        {question.options.map((option, idx) => (
                                                                                            <li key={option.id || idx} className={`mb-1 ${option.is_correct ? 'text-success font-weight-bold' : ''}`}>
                                                                                                <i className={`ni ni-${option.is_correct ? 'check-bold' : 'simple-remove'} mr-2`}></i>
                                                                                                {option.option_text}
                                                                                                {option.is_correct && ' (صحيح)'}
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
                                                                                {isPublished ? 'منشور حالياً' :
                                                                                    wasPublished ? 'إعادة نشر' : 'نشر'}
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
                                                                                            handleCloseQuestion(publication.publication_id || publication.id);
                                                                                        }
                                                                                    }}
                                                                                    className="mb-2"
                                                                                >
                                                                                    <i className="ni ni-fat-remove mr-1"></i>
                                                                                    إغلاق
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
                                                    لا توجد أسئلة بعد. أنشئ أسئلة للتفاعل مع طلابك خلال المحاضرة.
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
                                                        محادثة المحاضرة
                                                    </CardTitle>
                                                    <Button color="link" size="sm" onClick={fetchChat}>
                                                        <i className="ni ni-refresh mr-1"></i>
                                                        تحديث
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
                                                                        {new Date(message.sent_at).toLocaleTimeString('ar-SA', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </small>
                                                                </div>
                                                                <p className="mb-0">{message.message}</p>
                                                                {message.user?.role === 'student' && (
                                                                    <small className="d-block mt-1 text-muted">
                                                                        طالب
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <i className="ni ni-chat-round text-muted" style={{ fontSize: '3rem' }}></i>
                                                        <p className="mt-3 text-muted">لا توجد رسائل بعد. ابدأ المحادثة!</p>
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
                                                إرسال رسالة
                                            </CardTitle>
                                            <Form onSubmit={handleSendMessage}>
                                                <FormGroup>
                                                    <Input
                                                        type="textarea"
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        placeholder="اكتب رسالتك هنا..."
                                                        rows="4"
                                                        maxLength="500"
                                                    />
                                                    <small className="text-muted float-right">
                                                        {newMessage.length}/500 حرف
                                                    </small>
                                                </FormGroup>
                                                <Button
                                                    type="submit"
                                                    color="primary"
                                                    block
                                                    disabled={!newMessage.trim() || connectionStatus !== 'connected'}
                                                >
                                                    <i className="ni ni-send mr-2"></i>
                                                    إرسال الرسالة
                                                    {connectionStatus !== 'connected' && ' (غير متصل)'}
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
                                                    الأسئلة المنشورة
                                                    <Badge color="warning" className="mr-2">
                                                        {publishedQuestions.filter(p => p.status === 'published').length} نشط
                                                    </Badge>
                                                </CardTitle>
                                                <div>
                                                    <Button color="info" size="sm" className="mr-2" onClick={fetchPublishedQuestions}>
                                                        <i className="ni ni-refresh mr-1"></i>
                                                        تحديث
                                                    </Button>
                                                    <Button
                                                        color="danger"
                                                        size="sm"
                                                        onClick={handleCloseAllQuestions}
                                                        disabled={publishedQuestions.filter(p => p.status === 'published').length === 0}
                                                    >
                                                        <i className="ni ni-fat-remove mr-1"></i>
                                                        إغلاق الكل
                                                    </Button>
                                                </div>
                                            </div>

                                            {publishedQuestions.length > 0 ? (
                                                publishedQuestions.map((publication) => {
                                                    const question = publication.question;
                                                    const timeLeft = calculateTimeLeft(publication.expires_at);
                                                    const isActive = publication.status === 'published' && !timeLeft.isExpired;
                                                    const publicationKey = publication.publication_id || publication.id;

                                                    return (
                                                        <Card key={publicationKey} className={`mb-3 border-left-${isActive ? 'warning' : 'secondary'} border-left-3`}>
                                                            <CardBody>
                                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                                    <div style={{ flex: 1 }}>
                                                                        <h5>{question?.question_text}</h5>
                                                                        <div className="d-flex align-items-center flex-wrap gap-2 mt-2">
                                                                            <Badge color="info">
                                                                                {question?.type === 'mcq' ? 'اختيار متعدد' :
                                                                                    question?.type === 'true_false' ? 'صح/خطأ' :
                                                                                        'إجابة قصيرة'}
                                                                            </Badge>
                                                                            <Badge color="success">
                                                                                {question?.points || 0} نقطة
                                                                            </Badge>
                                                                            <Badge color={isActive ? "warning" : "secondary"}>
                                                                                {publication.status === 'closed'
                                                                                    ? 'مغلق'
                                                                                    : timeLeft.isExpired
                                                                                        ? 'منتهي'
                                                                                        : `${timeLeft.minutes}:${String(timeLeft.seconds).padStart(2, '0')} متبقي`
                                                                                }
                                                                            </Badge>
                                                                            <Badge color="light" className="text-dark">
                                                                                نشر: {new Date(publication.published_at).toLocaleTimeString('ar-SA')}
                                                                            </Badge>
                                                                            <Badge color="light" className="text-dark">
                                                                                ينتهي: {new Date(publication.expires_at).toLocaleTimeString('ar-SA')}
                                                                            </Badge>
                                                                        </div>

                                                                        {/* Show answers count */}
                                                                        <div className="mt-3">
                                                                            <Badge color="info">
                                                                                <i className="ni ni-single-copy-04 mr-1"></i>
                                                                                {publication.answers?.length || 0} إجابة
                                                                            </Badge>
                                                                        </div>

                                                                        {/* Show question options */}
                                                                        {question?.options && question.options.length > 0 && (
                                                                            <div className="mt-3">
                                                                                <h6>الخيارات:</h6>
                                                                                <ul className="list-unstyled mb-0">
                                                                                    {question.options.map((option, idx) => (
                                                                                        <li
                                                                                            key={option.id || idx}
                                                                                            className={`mb-1 ${option.is_correct ? 'text-success font-weight-bold' : ''}`}
                                                                                        >
                                                                                            <i className={`ni ni-${option.is_correct ? 'check-bold' : 'simple-remove'} mr-2`}></i>
                                                                                            {option.option_text}
                                                                                            {option.is_correct && ' (صحيح)'}
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        )}

                                                                        {/* Show recent answers */}
                                                                        {publication.answers && publication.answers.length > 0 && (
                                                                            <div className="mt-3">
                                                                                <h6>آخر الإجابات:</h6>
                                                                                <ul className="list-unstyled">
                                                                                    {publication.answers.slice(0, 3).map((answer, idx) => (
                                                                                        <li key={idx} className="mb-1">
                                                                                            <i className="ni ni-single-02 mr-2 text-info"></i>
                                                                                            {answer.student?.full_name || 'طالب'}:
                                                                                            <span className={`ml-2 ${answer.is_correct ? 'text-success' : 'text-danger'}`}>
                                                                                                {answer.answer_text || 'إجابة'}
                                                                                            </span>
                                                                                            <small className="text-muted mr-2">
                                                                                                ({new Date(answer.submitted_at).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})})
                                                                                            </small>
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
                                                                                onClick={() => handleCloseQuestion(publication.publication_id || publication.id)}
                                                                                className="mb-2"
                                                                                block
                                                                            >
                                                                                <i className="ni ni-fat-remove mr-1"></i>
                                                                                إغلاق الآن
                                                                            </Button>
                                                                        ) : (
                                                                            <Badge color="secondary" className="p-2 mb-2">
                                                                                {publication.status === 'closed' ? 'مغلق' : 'منتهي'}
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
                                                                                إعادة نشر
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
                                                    لا توجد أسئلة منشورة بعد. انشر سؤالاً من تبويب الأسئلة.
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
                            إنشاء سؤال جديد
                        </ModalHeader>
                        <Form onSubmit={handleCreateQuestion}>
                            <ModalBody>
                                <FormGroup>
                                    <Label>نوع السؤال</Label>
                                    <Input
                                        type="select"
                                        value={questionForm.type}
                                        onChange={(e) => {
                                            const newType = e.target.value;
                                            let newOptions = [];
                                            let correctIndex = 0;

                                            if (newType === 'true_false') {
                                                newOptions = [
                                                    { text: 'صح', is_correct: true },
                                                    { text: 'خطأ', is_correct: false }
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
                                        <option value="mcq">اختيار متعدد</option>
                                        <option value="true_false">صح/خطأ</option>
                                        <option value="short">إجابة قصيرة</option>
                                    </Input>
                                </FormGroup>

                                <FormGroup>
                                    <Label>نص السؤال</Label>
                                    <Input
                                        type="textarea"
                                        value={questionForm.question_text}
                                        onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                        placeholder="اكتب سؤالك هنا..."
                                        rows="3"
                                        required
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label>النقاط</Label>
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
                                        <Label>الخيارات</Label>
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
                                                    placeholder={`الخيار ${index + 1}`}
                                                    className="ml-2"
                                                    required
                                                    disabled={questionForm.type === 'true_false' && index < 2}
                                                />
                                                <FormGroup check className="ml-2">
                                                    <Label check>
                                                        <Input
                                                            type="radio"
                                                            name="correct_option"
                                                            checked={index === questionForm.correct_index}
                                                            onChange={() => setQuestionForm({ ...questionForm, correct_index: index })}
                                                        />{' '}
                                                        صحيح
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
                                                <i className="ni ni-fat-add mr-1"></i> إضافة خيار آخر
                                            </Button>
                                        )}
                                    </>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button type="submit" color="primary">
                                    <i className="ni ni-check-bold mr-1"></i>
                                    إنشاء السؤال
                                </Button>
                                <Button color="secondary" onClick={() => setQuestionModal(false)}>
                                    <i className="ni ni-fat-remove mr-1"></i>
                                    إلغاء
                                </Button>
                            </ModalFooter>
                        </Form>
                    </Modal>

                    {/* Interaction Report Modal */}
                    <Modal isOpen={reportModal} toggle={() => setReportModal(!reportModal)} size="lg">
                        <ModalHeader toggle={() => setReportModal(!reportModal)}>
                            <i className="ni ni-chart-bar-32 mr-2"></i>
                            تقرير التفاعل
                        </ModalHeader>
                        <ModalBody>
                            {interactionReport ? (
                                <div>
                                    <Card className="mb-4">
                                        <CardBody>
                                            <CardTitle tag="h5">ملخص</CardTitle>
                                            <Row>
                                                <Col md="4">
                                                    <div className="text-center">
                                                        <h2 className="text-primary">{interactionReport.summary?.publications_count || 0}</h2>
                                                        <p className="text-muted mb-0">أسئلة منشورة</p>
                                                    </div>
                                                </Col>
                                                <Col md="4">
                                                    <div className="text-center">
                                                        <h2 className="text-success">{interactionReport.summary?.answers_count || 0}</h2>
                                                        <p className="text-muted mb-0">إجابات</p>
                                                    </div>
                                                </Col>
                                                <Col md="4">
                                                    <div className="text-center">
                                                        <h2 className="text-warning">{interactionReport.summary?.total_score_awarded || 0}</h2>
                                                        <p className="text-muted mb-0">نقاط ممنوحة</p>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>

                                    <Card>
                                        <CardBody>
                                            <CardTitle tag="h5">أداء الطلاب</CardTitle>
                                            {interactionReport.by_student && interactionReport.by_student.length > 0 ? (
                                                <Table responsive>
                                                    <thead>
                                                    <tr>
                                                        <th>الطالب</th>
                                                        <th>أسئلة تمت محاولتها</th>
                                                        <th>إجابات صحيحة</th>
                                                        <th>إجمالي النقاط</th>
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
                                                    لا توجد بيانات تفاعل للطلاب بعد.
                                                </Alert>
                                            )}
                                        </CardBody>
                                    </Card>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <Spinner color="primary" />
                                    <p className="mt-3">جاري تحميل التقرير...</p>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={() => setReportModal(false)}>
                                إغلاق
                            </Button>
                        </ModalFooter>
                    </Modal>
                </>
            ) : (
                <Alert color="danger">
                    <h4>المحاضرة غير موجودة</h4>
                    <Button color="primary" onClick={() => navigate('/teacher/dashboard')}>
                        العودة للوحة التحكم
                    </Button>
                </Alert>
            )}
        </div>
    );
};

export default LectureLive;