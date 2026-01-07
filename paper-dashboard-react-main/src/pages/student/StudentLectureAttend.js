import React, { useState, useEffect, useCallback } from 'react';
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
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();
    const { user } = useAuth();

    // ==================== Real-time Handlers ====================
    const handleQuestionPublished = useCallback((data) => {
        console.log('✅ Question published (student):', data);

        const newQuestion = {
            ...data,
            id: data.id || `pub-${Date.now()}`,
            status: 'published',
            published_at: data.published_at || new Date().toISOString(),
            expires_at: data.expires_at || new Date(Date.now() + 5 * 60000).toISOString(),
            question: data.question || {
                id: data.question_id,
                question_text: data.question_text || 'Question text not available',
                type: data.type || 'mcq',
                points: data.points || 1,
                options: data.options || []
            }
        };

        setActiveQuestions(prev => {
            // تجنب التكرار
            const exists = prev.find(q =>
                q.id === newQuestion.id ||
                (q.question_id === newQuestion.question_id && q.status === 'published')
            );

            if (exists) {
                return prev.map(q =>
                    q.id === newQuestion.id ? newQuestion : q
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

    const handleQuestionClosed = useCallback((data) => {
        console.log('✅ Question closed (student):', data);

        setActiveQuestions(prev => prev.filter(q =>
            q.id !== data.id && q.question_id !== data.question_id
        ));

        enqueueSnackbar('تم إغلاق السؤال', {
            variant: 'info',
            autoHideDuration: 3000,
            anchorOrigin: { vertical: 'top', horizontal: 'left' }
        });
    }, [enqueueSnackbar]);

    const handleChatMessageSent = useCallback((data) => {
        console.log('✅ Chat message (student):', data);

        setChatMessages(prev => {
            // تجنب تكرار الرسائل
            const exists = prev.find(m =>
                m.id === data.message?.id ||
                (m.user?.id === data.message?.user?.id && m.sent_at === data.message?.sent_at)
            );

            if (exists) return prev;

            return [...prev, {
                ...(data.message || data),
                user: data.user || { full_name: 'Unknown', role: 'teacher' },
                sent_at: data.sent_at || new Date().toISOString(),
                id: data.message?.id || `msg-${Date.now()}`
            }];
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
    }, [enqueueSnackbar]);

    const handleLectureEnded = useCallback((data) => {
        console.log('🏁 Lecture ended (student):', data);

        enqueueSnackbar('تم إنهاء المحاضرة', {
            variant: 'warning',
            autoHideDuration: 5000,
            anchorOrigin: { vertical: 'top', horizontal: 'center' }
        });

        // إلغاء interval الـ heartbeat
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            setHeartbeatInterval(null);
        }

        setTimeout(() => {
            navigate('/student/lectures/today');
        }, 3000);
    }, [enqueueSnackbar, navigate]);

    // ==================== Real-time Hook ====================
    useStudentLectureRealtime(lectureId, user?.id, {
        onQuestionPublished: handleQuestionPublished,
        onQuestionClosed: handleQuestionClosed,
        onChatMessageSent: handleChatMessageSent,
        onAnswerSubmitted: handleAnswerSubmitted,
        onLectureEnded: handleLectureEnded,
        onRealtimeConnected: (status) => setConnectionStatus(status),
        onRealtimeError: () => setConnectionStatus('error')
    });

    // ==================== API Functions ====================
    const fetchActiveQuestions = useCallback(async () => {
        try {
            const response = await callApi(() => lectureService.getStudentActiveQuestions(lectureId));
            setActiveQuestions(response.data || []);
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

            // Get lecture from today's lectures
            const lecturesResponse = await callApi(() => lectureService.getStudentTodayLectures());
            const lectures = lecturesResponse.data || [];
            const foundLecture = lectures.find(l => l.id === parseInt(lectureId));

            if (!foundLecture) {
                enqueueSnackbar('المحاضرة غير موجودة أو غير متاحة اليوم', { variant: 'error' });
                navigate('/student/lectures/today');
                return;
            }

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

        // تنظيف الـ interval عند unmount
        return () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
        };
    }, [lectureId, navigate, enqueueSnackbar, fetchLectureData]); // ✅ أضفت fetchLectureData هنا

    // استخدام useEffect منفصل للتعامل مع heartbeatInterval
    useEffect(() => {
        return () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
        };
    }, [heartbeatInterval]);

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

            // Send initial heartbeat
            await sendHeartbeat(token);

            // Start heartbeat interval (every 10 minutes)
            const interval = setInterval(() => sendHeartbeat(token), 600000);
            setHeartbeatInterval(interval);

            enqueueSnackbar('تم الانضمام إلى المحاضرة بنجاح!', { variant: 'success' });

        } catch (error) {
            if (error.response?.status === 403) {
                enqueueSnackbar('يمكنك الانضمام فقط خلال وقت المحاضرة.', { variant: 'error' });
            } else {
                enqueueSnackbar('فشل الانضمام إلى المحاضرة. حاول مرة أخرى.', { variant: 'error' });
            }
        } finally {
            setJoining(false);
        }
    };

    const sendHeartbeat = async (token) => {
        try {
            await lectureService.sendHeartbeat(token);
            console.log('✅ Heartbeat sent successfully');
        } catch (error) {
            console.error('❌ Heartbeat failed:', error);
            if (error.response?.status === 403) {
                enqueueSnackbar('فشل التحقق من الحضور. قد يتم تسجيلك كمغادر.', { variant: 'warning' });
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (!attendanceToken) {
            enqueueSnackbar('يجب الانضمام إلى المحاضرة أولاً', { variant: 'warning' });
            return;
        }

        try {
            await callApi(() => chatService.sendStudentMessage(lectureId, newMessage), 'تم إرسال الرسالة');
            // لا نحتاج لـ fetchChat هنا لأن الرسالة ستأتي عبر real-time
            setNewMessage('');
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleAnswerQuestion = async (publicationId, selectedOptionId = null, answerText = null) => {
        if (!attendanceToken) {
            enqueueSnackbar('يجب الانضمام إلى المحاضرة أولاً', { variant: 'warning' });
            return;
        }

        try {
            const answerData = {
                publication_id: publicationId,
                selected_option_id: selectedOptionId,
                answer_text: answerText,
            };

            await callApi(() => questionService.submitAnswer(answerData), 'تم إرسال الإجابة بنجاح');

            // Remove the answered question from active questions
            setActiveQuestions(prev => prev.filter(q => q.id !== publicationId));

            // Clear the selected answer
            setSelectedAnswers(prev => {
                const newAnswers = { ...prev };
                delete newAnswers[publicationId];
                return newAnswers;
            });

        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleLeaveLecture = () => {
        // Clear heartbeat interval
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            setHeartbeatInterval(null);
        }

        enqueueSnackbar('لقد غادرت المحاضرة', { variant: 'info' });
        navigate('/student/lectures/today');
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
                        <Button color="danger" onClick={handleLeaveLecture}>
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
                                            const isActive = publication.status === 'published' && !timeLeft.isExpired;

                                            return (
                                                <Card key={publication.id} className={`mb-3 border-left-${isActive ? 'warning' : 'secondary'} border-left-3`}>
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
                                                                    {timeLeft.total > 0 && (
                                                                        <Badge color="warning">
                                                                            {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, '0')} متبقي
                                                                        </Badge>
                                                                    )}
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
                                                                                name={`question-${publication.id}`}
                                                                                checked={selectedAnswers[publication.id] === option.id}
                                                                                onChange={() => {
                                                                                    setSelectedAnswers(prev => ({
                                                                                        ...prev,
                                                                                        [publication.id]: option.id
                                                                                    }));
                                                                                }}
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
                                                                                name={`question-${publication.id}`}
                                                                                checked={selectedAnswers[publication.id] === option.id}
                                                                                onChange={() => {
                                                                                    setSelectedAnswers(prev => ({
                                                                                        ...prev,
                                                                                        [publication.id]: option.id
                                                                                    }));
                                                                                }}
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
                                                                    value={selectedAnswers[publication.id] || ''}
                                                                    onChange={(e) => {
                                                                        setSelectedAnswers(prev => ({
                                                                            ...prev,
                                                                            [publication.id]: e.target.value
                                                                        }));
                                                                    }}
                                                                    placeholder="اكتب إجابتك هنا..."
                                                                    rows="3"
                                                                />
                                                            </FormGroup>
                                                        )}

                                                        <Button
                                                            color="primary"
                                                            onClick={() => {
                                                                if (question?.type === 'short') {
                                                                    handleAnswerQuestion(publication.id, null, selectedAnswers[publication.id]);
                                                                } else {
                                                                    handleAnswerQuestion(publication.id, selectedAnswers[publication.id]);
                                                                }
                                                            }}
                                                            disabled={!selectedAnswers[publication.id]?.toString().trim()}
                                                            className="mt-3"
                                                        >
                                                            إرسال الإجابة
                                                        </Button>
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
                                                    <Button color="link" size="sm" onClick={fetchChat}>
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
                    </TabContent>
                </>
            )}
        </div>
    );
};

export default StudentLectureAttend;