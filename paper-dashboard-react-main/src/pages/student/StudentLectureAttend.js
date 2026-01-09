import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Alert,
    Form,
    FormGroup,
    Label,
    Input,
    Badge,
    Spinner
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import classnames from 'classnames';
import { lectureService } from '../../services/lectureService';
import { questionService } from '../../services/questionService';
import { chatService } from '../../services/chatService';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentLectureRealtime } from '../../hooks/useRealtime';

const StudentLectureAttend = () => {
    const { lectureId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('1');
    const [lecture, setLecture] = useState(null);
    const [activeQuestions, setActiveQuestions] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attendanceToken, setAttendanceToken] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [heartbeatInterval, setHeartbeatInterval] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    // مراقبة النشاط
    const [lastActivity, setLastActivity] = useState(Date.now());
    const activityTimeoutRef = useRef(null);
    const [isActive, setIsActive] = useState(true);

    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();
    const { user } = useAuth();

    // ==================== Activity Monitoring ====================
    const resetActivityTimer = useCallback(() => {
        setLastActivity(Date.now());
        setIsActive(true);

        // إلغاء المهلة السابقة
        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
        }

        // تعيين مهلة جديدة للنشاط (5 دقائق)
        activityTimeoutRef.current = setTimeout(() => {
            setIsActive(false);
            console.log('⚠️ User inactive for 5 minutes');
            enqueueSnackbar('أنت غير نشط! تحرك للحفاظ على حضورك.', {
                variant: 'warning',
                autoHideDuration: 3000
            });
        }, 5 * 60 * 1000); // 5 دقائق
    }, [enqueueSnackbar]);

    // مستمعي الأحداث للنشاط
    useEffect(() => {
        if (!attendanceToken) return;

        const handleUserActivity = () => {
            resetActivityTimer();
        };

        // إضافة مستمعي الأحداث
        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        window.addEventListener('click', handleUserActivity);
        window.addEventListener('scroll', handleUserActivity);
        window.addEventListener('touchstart', handleUserActivity);

        // بدء مؤقت النشاط
        resetActivityTimer();

        return () => {
            // تنظيف المستمعين
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('scroll', handleUserActivity);
            window.removeEventListener('touchstart', handleUserActivity);

            // تنظيف المؤقت
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
        };
    }, [attendanceToken, resetActivityTimer]);

    // تنبيهات النشاط
    useEffect(() => {
        if (!attendanceToken || isActive) return;

        // إرسال تنبيه كل دقيقة عند عدم النشاط
        const inactivityAlertInterval = setInterval(() => {
            if (!isActive) {
                enqueueSnackbar('ما زلت غير نشط! تحرك للحفاظ على حضورك.', {
                    variant: 'warning',
                    autoHideDuration: 3000
                });
            }
        }, 60000); // كل دقيقة

        return () => clearInterval(inactivityAlertInterval);
    }, [isActive, attendanceToken, enqueueSnackbar]);

    // ==================== Real-time Handlers ====================
    const handleQuestionPublished = useCallback((data) => {
        console.log('✅ Question published (student):', data);

        // Check if data has the expected structure
        if (!data) return;

        // Extract publication data
        const publicationData = data.publication || data;
        const questionData = data.question || {};

        // Get publication ID
        const publicationId = publicationData.id;

        if (!publicationId) {
            console.error('❌ No publication ID found in question data:', data);
            return;
        }

        // Normalize options to use option_text (some APIs send 'text', some send 'option_text')
        const normalizedOptions = (questionData.options || []).map(option => ({
            id: option.id,
            option_text: option.option_text || option.text || 'Option', // Handle both 'option_text' and 'text'
            is_correct: option.is_correct || false
        }));

        const newQuestion = {
            id: publicationId,
            publication_id: publicationId,
            status: 'published',
            published_at: publicationData.published_at || new Date().toISOString(),
            expires_at: publicationData.expires_at || new Date(Date.now() + 5 * 60000).toISOString(),
            question: {
                id: questionData.id,
                question_text: questionData.question_text || 'Question text not available',
                type: questionData.type || 'mcq',
                points: questionData.points || 1,
                options: normalizedOptions
            }
        };

        console.log('🔄 Processed question for state:', newQuestion);

        setActiveQuestions(prev => {
            // Avoid duplicates by checking publication_id
            const exists = prev.find(q =>
                q.publication_id === newQuestion.publication_id
            );

            if (exists) {
                return prev.map(q =>
                    q.publication_id === newQuestion.publication_id ? newQuestion : q
                );
            }

            enqueueSnackbar('تم نشر سؤال جديد', {
                variant: 'success',
                autoHideDuration: 3000,
                anchorOrigin: { vertical: 'top', horizontal: 'left' }
            });

            return [newQuestion, ...prev];
        });
    }, [enqueueSnackbar]);

    const handleLeaveLecture = async () => {
        try {
            // تنظيف مؤقت النشاط
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }

            // إرسال طلب مغادرة المحاضرة
            await callApi(() => lectureService.leaveLecture(parseInt(lectureId)));

            // تنظيف الـ interval
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                setHeartbeatInterval(null);
            }

            // إظهار رسالة نجاح
            enqueueSnackbar('تم تسجيل مغادرتك للمحاضرة', {
                variant: 'success',
                autoHideDuration: 3000,
                anchorOrigin: { vertical: 'top', horizontal: 'center' }
            });

            // الانتقال بعد ثانية واحدة
            setTimeout(() => {
                navigate('/student/lectures/today');
            }, 1000);

        } catch (error) {
            console.error('❌ Error leaving lecture:', error);
            enqueueSnackbar('حدث خطأ أثناء مغادرة المحاضرة', { variant: 'error' });
        }
    };

    const handleQuestionClosed = useCallback((data) => {
        console.log('✅ Question closed (student):', data);

        // Extract publication ID from data - based on the real-time structure you provided
        let publicationId = null;

        if (data.publication_id) {
            publicationId = data.publication_id;
        } else if (data.id) {
            publicationId = data.id;
        }

        if (!publicationId) {
            console.error('❌ No publication ID found in close data:', data);
            return;
        }

        // Instead of removing the question, update its status to 'closed'
        setActiveQuestions(prev => prev.map(question => {
            if (question.publication_id === publicationId) {
                return {
                    ...question,
                    status: 'closed'
                };
            }
            return question;
        }));

        enqueueSnackbar('تم إغلاق السؤال', {
            variant: 'info',
            autoHideDuration: 3000,
            anchorOrigin: { vertical: 'top', horizontal: 'left' }
        });
    }, [enqueueSnackbar]);

    const handleChatMessageSent = useCallback((data) => {
        console.log('✅ Chat message (student):', data);

        setChatMessages(prev => {
            // Avoid duplicate messages
            const messageId = data.message?.id || data.id;
            const exists = prev.find(m => m.id === messageId);

            if (exists) return prev;

            const newMessage = {
                ...(data.message || data),
                user: data.user || data.message?.user || { full_name: 'Unknown', role: 'teacher' },
                sent_at: data.sent_at || data.message?.sent_at || new Date().toISOString(),
                id: messageId || `msg-${Date.now()}`
            };

            return [...prev, newMessage];
        });
    }, []);

    const handleAnswerSubmitted = useCallback((data) => {
        console.log('✅ Answer submitted (student):', data);

        if (data.is_correct) {
            enqueueSnackbar('إجابة صحيحة! 🎉', {
                variant: 'success',
                autoHideDuration: 3000,
                anchorOrigin: { vertical: 'top', horizontal: 'left' }
            });
        } else {
            enqueueSnackbar('إجابة خاطئة، حاول مرة أخرى', {
                variant: 'warning',
                autoHideDuration: 3000,
                anchorOrigin: { vertical: 'top', horizontal: 'left' }
            });
        }

        // Remove the answered question from active questions
        if (data.publication_id) {
            setActiveQuestions(prev => prev.filter(q =>
                q.publication_id !== data.publication_id
            ));

            // Clear selected answer
            setSelectedAnswers(prev => {
                const newAnswers = { ...prev };
                delete newAnswers[data.publication_id];
                return newAnswers;
            });
        }
    }, [enqueueSnackbar]);

    const handleLectureEnded = useCallback((data) => {
        console.log('🏁 Lecture ended (student):', data);

        enqueueSnackbar('تم إنهاء المحاضرة', {
            variant: 'warning',
            autoHideDuration: 5000,
            anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });

        // تنظيف مؤقت النشاط
        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
        }

        // Clear heartbeat interval
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            setHeartbeatInterval(null);
        }

        setTimeout(() => {
            navigate('/student/lectures/today');
        }, 3000);
    }, [enqueueSnackbar, navigate, heartbeatInterval]);

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
    useStudentLectureRealtime(lectureId, user?.id, {
        onQuestionPublished: handleQuestionPublished,
        onQuestionClosed: handleQuestionClosed,
        onChatMessageSent: handleChatMessageSent,
        onAnswerSubmitted: handleAnswerSubmitted,
        onLectureEnded: handleLectureEnded,
        onRealtimeConnected: handleRealtimeConnected,
        onRealtimeError: handleRealtimeError
    });

    // ==================== API Functions ====================
    const fetchActiveQuestions = useCallback(async () => {
        try {
            console.log('📥 Fetching active questions for lecture:', lectureId);
            const response = await callApi(() => lectureService.getStudentActiveQuestions(lectureId));
            console.log('📊 Active questions response:', response.data);

            // Transform the response to match our state structure with normalized options
            const questions = (response.data || []).map(item => {
                // Normalize options to use option_text
                const normalizedOptions = (item.options || []).map(option => ({
                    id: option.id,
                    option_text: option.option_text || option.text || 'Option',
                    is_correct: option.is_correct || false
                }));

                return {
                    id: item.id || item.publication_id,
                    publication_id: item.id || item.publication_id,
                    status: item.status || 'published',
                    published_at: item.published_at,
                    expires_at: item.expires_at,
                    question: {
                        id: item.question_id,
                        question_text: item.question_text || item.text,
                        type: item.type,
                        points: item.points,
                        options: normalizedOptions
                    }
                };
            });

            setActiveQuestions(questions);
        } catch (error) {
            console.error('❌ Error fetching questions:', error);
            setActiveQuestions([]);
        }
    }, [callApi, lectureId]);

    const fetchChat = useCallback(async () => {
        try {
            const response = await callApi(() => chatService.getStudentChat(lectureId));
            setChatMessages(response.data || []);
        } catch (error) {
            console.error('❌ Error fetching chat:', error);
            setChatMessages([]);
        }
    }, [callApi, lectureId]);

    // ==================== Initial Data Fetch ====================
    const fetchLectureData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🚀 Fetching lecture data for ID:', lectureId);

            // Get lecture from today's lectures
            const lecturesResponse = await callApi(() => lectureService.getStudentTodayLectures());
            const lectures = lecturesResponse.data || [];
            const foundLecture = lectures.find(l => l.id === parseInt(lectureId));

            if (!foundLecture) {
                enqueueSnackbar('المحاضرة غير موجودة أو غير متاحة اليوم', { variant: 'error' });
                navigate('/student/lectures/today');
                return;
            }

            console.log('✅ Found lecture:', foundLecture);
            setLecture(foundLecture);

            // Check if lecture is running
            if (foundLecture?.status !== 'running') {
                enqueueSnackbar('هذه المحاضرة غير نشطة حالياً', { variant: 'warning' });
                navigate('/student/lectures/today');
                return;
            }

            // Fetch initial data
            await Promise.all([
                fetchActiveQuestions(),
                fetchChat()
            ]);

        } catch (error) {
            console.error('❌ Error fetching lecture data:', error);
            enqueueSnackbar('فشل تحميل بيانات المحاضرة', { variant: 'error' });
            navigate('/student/lectures/today');
        } finally {
            setLoading(false);
        }
    }, [callApi, lectureId, enqueueSnackbar, navigate, fetchActiveQuestions, fetchChat]);

    useEffect(() => {
        if (!lectureId || isNaN(lectureId)) {
            enqueueSnackbar('معرّف المحاضرة غير صالح', { variant: 'error' });
            navigate('/student/lectures/today');
            return;
        }

        fetchLectureData();

        // Cleanup interval on unmount
        return () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
        };
    }, [lectureId, navigate, enqueueSnackbar, fetchLectureData, heartbeatInterval]);

    // ==================== Heartbeat Functions ====================
    const sendHeartbeat = useCallback(async (token) => {
        // لا ترسل نبضة إذا كان المستخدم غير نشط
        if (!isActive) {
            console.log('⏸️ Skipping heartbeat - user inactive');
            return;
        }

        try {
            await lectureService.sendHeartbeat(token);
            console.log('✅ Heartbeat sent successfully');
        } catch (error) {
            console.error('❌ Heartbeat failed:', error);
            if (error.response?.status === 403) {
                enqueueSnackbar('فشل التحقق من الحضور. قد يتم تسجيلك كمغادر.', { variant: 'warning' });
            }
        }
    }, [isActive, enqueueSnackbar]);

    const joinLecture = async () => {
        setJoining(true);
        try {
            // Get attendance token
            const tokenResponse = await callApi(() => lectureService.getAttendanceToken(parseInt(lectureId)));
            const token = tokenResponse.data?.token;

            if (!token) {
                throw new Error('لم يتم استلام رمز الحضور');
            }

            setAttendanceToken(token);
            setIsActive(true);
            setLastActivity(Date.now());

            // Send initial heartbeat
            await sendHeartbeat(token);

            // Start heartbeat interval (كل 2 دقيقة)
            const interval = setInterval(() => {
                if (isActive) {
                    sendHeartbeat(token);
                }
            }, 120000); // 2 دقيقة

            setHeartbeatInterval(interval);

            enqueueSnackbar('تم الانضمام إلى المحاضرة بنجاح!', { variant: 'success' });

        } catch (error) {
            console.error('❌ Error joining lecture:', error);
            if (error.response?.status === 403) {
                enqueueSnackbar('يمكنك الانضمام فقط خلال وقت المحاضرة.', { variant: 'error' });
            } else {
                enqueueSnackbar('فشل الانضمام إلى المحاضرة. حاول مرة أخرى.', { variant: 'error' });
            }
        } finally {
            setJoining(false);
        }
    };

    // ==================== Chat Functions ====================
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (!attendanceToken) {
            enqueueSnackbar('يجب الانضمام إلى المحاضرة أولاً', { variant: 'warning' });
            return;
        }

        try {
            await callApi(() => chatService.sendStudentMessage(lectureId, newMessage), 'تم إرسال الرسالة');
            setNewMessage('');
        } catch (error) {
            // Error is handled by useApi
        }
    };

    // ==================== Question Functions ====================
    const handleAnswerQuestion = async (publicationId, selectedOptionId = null, answerText = null) => {
        if (!attendanceToken) {
            enqueueSnackbar('يجب الانضمام إلى المحاضرة أولاً', { variant: 'warning' });
            return;
        }

        console.log('📤 Submitting answer for publication:', publicationId);

        try {
            const answerData = {
                publication_id: parseInt(publicationId), // Ensure it's an integer
                selected_option_id: selectedOptionId,
                answer_text: answerText,
            };

            console.log('📝 Answer data:', answerData);

            await callApi(() => questionService.submitAnswer(answerData), 'تم إرسال الإجابة بنجاح');

            // Note: The question will be removed via real-time event (handleAnswerSubmitted)

        } catch (error) {
            console.error('❌ Error submitting answer:', error);
        }
    };

    // ==================== Utility Functions ====================
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

    // ==================== Render Functions ====================
    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">جاري تحميل المحاضرة...</p>
            </div>
        );
    }

    if (!lecture) {
        return (
            <Alert color="danger">
                <h4>المحاضرة غير موجودة</h4>
                <p>المحاضرة التي تحاول الوصول إليها غير موجودة أو ليس لديك إذن لعرضها.</p>
                <Button color="primary" onClick={() => navigate('/student/lectures/today')}>
                    العودة إلى المحاضرات
                </Button>
            </Alert>
        );
    }

    return (
        <div className="container-fluid">
            {/* Lecture Header */}
            <Row className="mb-4 align-items-center">
                <Col md="8">
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
                        الشعبة: {lecture.section?.name} | المحاضرة #{lecture.lecture_no} |
                        المحاضر: {lecture.instructor?.full_name}
                    </p>
                    {attendanceToken && (
                        <div className="mt-2">
                            <Badge color={getConnectionStatusColor()} className="mr-2" pill>
                                <i className={`ni ni-${connectionStatus === 'connected' ? 'spaceship' : 'watch-time'} mr-1`}></i>
                                {getConnectionStatusText()}
                            </Badge>
                            <Badge color={isActive ? "success" : "warning"} className="mr-2" pill>
                                <i className={`ni ni-${isActive ? 'user-run' : 'watch-time'} mr-1`}></i>
                                {isActive ? 'نشط' : 'غير نشط'}
                            </Badge>
                            <small className="text-muted">
                                آخر نشاط: {Math.floor((Date.now() - lastActivity) / 1000)} ثانية
                            </small>
                        </div>
                    )}
                </Col>
                <Col md="4" className="text-left">
                    {!attendanceToken ? (
                        <Button
                            color="primary"
                            onClick={joinLecture}
                            disabled={joining}
                        >
                            {joining ? (
                                <>
                                    <Spinner size="sm" />
                                    <span className="mr-2">جاري الانضمام...</span>
                                </>
                            ) : (
                                <>
                                    <i className="ni ni-user-run mr-1"></i>
                                    الانضمام إلى المحاضرة
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            color="danger"
                            onClick={() => {
                                if (window.confirm('هل أنت متأكد من مغادرة المحاضرة؟ سيتم تسجيل وقت مغادرتك.')) {
                                    handleLeaveLecture();
                                }
                            }}
                        >
                            <i className="ni ni-button-power mr-1"></i>
                            مغادرة المحاضرة
                        </Button>
                    )}
                </Col>
            </Row>

            {/* Join Lecture Card (if not joined) */}
            {!attendanceToken && (
                <Row className="mb-4">
                    <Col>
                        <Card className="border-left-primary border-left-3">
                            <CardBody>
                                <div className="text-center">
                                    <i className="ni ni-notification-70 text-primary" style={{ fontSize: '4rem' }}></i>
                                    <h4 className="mt-3">جاهز للانضمام إلى المحاضرة؟</h4>
                                    <p className="text-muted mb-4">
                                        اضغط على زر "الانضمام إلى المحاضرة" أعلاه للبدء.
                                        يجب أن تبقى نشطًا خلال المحاضرة للحفاظ على حضورك.
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Lecture Content (only show if joined) */}
            {attendanceToken && (
                <>
                    {/* Tabs */}
                    <Nav tabs className="mb-3">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '1' })}
                                onClick={() => setActiveTab('1')}
                            >
                                <i className="ni ni-collection mr-1"></i>
                                الأسئلة ({activeQuestions.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '2' })}
                                onClick={() => setActiveTab('2')}
                            >
                                <i className="ni ni-chat-round mr-1"></i>
                                المحادثة ({chatMessages.length})
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab}>
                        {/* Questions Tab */}
                        <TabPane tabId="1">
                            <Row>
                                <Col>
                                    {activeQuestions.length > 0 ? (
                                        activeQuestions.map((publication) => {
                                            const question = publication.question;
                                            const timeLeft = calculateTimeLeft(publication.expires_at);
                                            const isClosed = publication.status === 'closed';
                                            const isExpired = timeLeft.isExpired;
                                            const isActiveQuestion = !isClosed && !isExpired && publication.status === 'published';

                                            return (
                                                <Card key={publication.publication_id} className={`mb-3 border-left-${isActiveQuestion ? 'warning' : 'secondary'} border-left-3`}>
                                                    <CardBody>
                                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                                            <div>
                                                                <h5>{question?.question_text}</h5>
                                                                <div className="d-flex align-items-center mt-2">
                                                                    <Badge color="info" className="mr-2">
                                                                        {question?.type === 'mcq' ? 'اختيار متعدد' :
                                                                            question?.type === 'true_false' ? 'صح/خطأ' :
                                                                                'إجابة قصيرة'}
                                                                    </Badge>
                                                                    <Badge color="success" className="mr-2">
                                                                        {question?.points || 0} نقطة
                                                                    </Badge>
                                                                    {isClosed ? (
                                                                        <Badge color="danger" className="mr-2">
                                                                            مغلق
                                                                        </Badge>
                                                                    ) : isExpired ? (
                                                                        <Badge color="secondary" className="mr-2">
                                                                            منتهي
                                                                        </Badge>
                                                                    ) : timeLeft.total > 0 ? (
                                                                        <Badge color="warning">
                                                                            {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, '0')} متبقي
                                                                        </Badge>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {question?.type === 'true_false' && (
                                                            <FormGroup tag="fieldset">
                                                                {question.options?.map((option, index) => (
                                                                    <FormGroup key={option.id} check>
                                                                        <Label check>
                                                                            <Input
                                                                                type="radio"
                                                                                name={`question-${publication.publication_id}`}
                                                                                checked={selectedAnswers[publication.publication_id] === option.id}
                                                                                onChange={() => {
                                                                                    if (!isClosed && !isExpired) {
                                                                                        setSelectedAnswers(prev => ({
                                                                                            ...prev,
                                                                                            [publication.publication_id]: option.id
                                                                                        }));
                                                                                        resetActivityTimer(); // إعادة تعيين النشاط
                                                                                    }
                                                                                }}
                                                                                disabled={isClosed || isExpired}
                                                                            />{' '}
                                                                            {option.option_text}
                                                                        </Label>
                                                                    </FormGroup>
                                                                ))}
                                                            </FormGroup>
                                                        )}

                                                        {question?.type === 'mcq' && (
                                                            <FormGroup tag="fieldset">
                                                                {question.options?.map((option) => (
                                                                    <FormGroup key={option.id} check>
                                                                        <Label check>
                                                                            <Input
                                                                                type="radio"
                                                                                name={`question-${publication.publication_id}`}
                                                                                checked={selectedAnswers[publication.publication_id] === option.id}
                                                                                onChange={() => {
                                                                                    if (!isClosed && !isExpired) {
                                                                                        setSelectedAnswers(prev => ({
                                                                                            ...prev,
                                                                                            [publication.publication_id]: option.id
                                                                                        }));
                                                                                        resetActivityTimer(); // إعادة تعيين النشاط
                                                                                    }
                                                                                }}
                                                                                disabled={isClosed || isExpired}
                                                                            />{' '}
                                                                            {option.option_text}
                                                                        </Label>
                                                                    </FormGroup>
                                                                ))}
                                                            </FormGroup>
                                                        )}

                                                        {question?.type === 'short' && (
                                                            <FormGroup>
                                                                <Input
                                                                    type="textarea"
                                                                    value={selectedAnswers[publication.publication_id] || ''}
                                                                    onChange={(e) => {
                                                                        if (!isClosed && !isExpired) {
                                                                            setSelectedAnswers(prev => ({
                                                                                ...prev,
                                                                                [publication.publication_id]: e.target.value
                                                                            }));
                                                                            resetActivityTimer(); // إعادة تعيين النشاط
                                                                        }
                                                                    }}
                                                                    placeholder="اكتب إجابتك هنا..."
                                                                    rows="3"
                                                                    disabled={isClosed || isExpired}
                                                                />
                                                            </FormGroup>
                                                        )}

                                                        {isClosed ? (
                                                            <Button
                                                                color="secondary"
                                                                disabled
                                                                className="mt-3"
                                                            >
                                                                <i className="ni ni-fat-remove mr-1"></i>
                                                                تم إغلاق السؤال
                                                            </Button>
                                                        ) : isExpired ? (
                                                            <Button
                                                                color="secondary"
                                                                disabled
                                                                className="mt-3"
                                                            >
                                                                <i className="ni ni-watch-time mr-1"></i>
                                                                انتهى وقت السؤال
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                color="primary"
                                                                onClick={() => {
                                                                    if (question?.type === 'short') {
                                                                        handleAnswerQuestion(
                                                                            publication.publication_id,
                                                                            null,
                                                                            selectedAnswers[publication.publication_id]
                                                                        );
                                                                    } else {
                                                                        handleAnswerQuestion(
                                                                            publication.publication_id,
                                                                            selectedAnswers[publication.publication_id]
                                                                        );
                                                                    }
                                                                    resetActivityTimer(); // إعادة تعيين النشاط
                                                                }}
                                                                disabled={!selectedAnswers[publication.publication_id]?.toString().trim()}
                                                                className="mt-3"
                                                            >
                                                                إرسال الإجابة
                                                            </Button>
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <Alert color="info">
                                            <i className="ni ni-bulb-61 mr-2"></i>
                                            لا توجد أسئلة نشطة حالياً. قد يقوم المحاضر بنشر أسئلة خلال المحاضرة.
                                        </Alert>
                                    )}
                                </Col>
                            </Row>
                        </TabPane>

                        {/* Chat Tab */}
                        <TabPane tabId="2">
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
                                                    <Button
                                                        color="link"
                                                        size="sm"
                                                        onClick={() => {
                                                            fetchChat();
                                                            resetActivityTimer(); // إعادة تعيين النشاط
                                                        }}
                                                    >
                                                        <i className="ni ni-refresh mr-1"></i>
                                                        تحديث
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="p-3" style={{ height: '400px', overflowY: 'auto' }}>
                                                {chatMessages.length > 0 ? (
                                                    chatMessages.map((message) => (
                                                        <div key={message.id} className={`mb-3 ${message.user?.role === 'student' ? 'text-right' : ''}`}>
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
                                                                {message.user?.role === 'teacher' && (
                                                                    <small className="d-block mt-1 text-white-50">
                                                                        محاضر
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
                                            <Form onSubmit={(e) => {
                                                handleSendMessage(e);
                                                resetActivityTimer(); // إعادة تعيين النشاط
                                            }}>
                                                <FormGroup>
                                                    <Input
                                                        type="textarea"
                                                        value={newMessage}
                                                        onChange={(e) => {
                                                            setNewMessage(e.target.value);
                                                            resetActivityTimer(); // إعادة تعيين النشاط
                                                        }}
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
                    </TabContent>
                </>
            )}
        </div>
    );
};

export default StudentLectureAttend;