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
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();

    useEffect(() => {
        if (!lectureId || isNaN(lectureId)) {
            enqueueSnackbar('Invalid lecture ID', { variant: 'error' });
            navigate('/student/lectures/today');
            return;
        }

        fetchLectureData();

        return () => {
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
        };
    }, [lectureId, navigate, enqueueSnackbar]);

    const fetchLectureData = async () => {
        try {
            setLoading(true);

            // Get lecture from today's lectures
            const lecturesResponse = await callApi(() => lectureService.getStudentTodayLectures());
            const lectures = lecturesResponse.data || [];
            const foundLecture = lectures.find(l => l.id === parseInt(lectureId));

            if (!foundLecture) {
                enqueueSnackbar('Lecture not found or not available today', { variant: 'error' });
                navigate('/student/lectures/today');
                return;
            }

            setLecture(foundLecture);

            // Check if lecture is running
            if (foundLecture?.status !== 'running') {
                enqueueSnackbar('This lecture is not currently active', { variant: 'warning' });
                navigate('/student/lectures/today');
                return;
            }

            // Fetch initial data
            await Promise.all([
                fetchActiveQuestions(),
                fetchChat()
            ]);

        } catch (error) {
            enqueueSnackbar('Failed to load lecture data', { variant: 'error' });
            navigate('/student/lectures/today');
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveQuestions = async () => {
        try {
            const response = await callApi(() => lectureService.getStudentActiveQuestions(lectureId));
            setActiveQuestions(response.data || []);
        } catch (error) {
            console.error('Error fetching questions:', error);
            setActiveQuestions([]);
        }
    };

    const fetchChat = async () => {
        try {
            const response = await callApi(() => chatService.getStudentChat(lectureId));
            setChatMessages(response.data || []);
        } catch (error) {
            console.error('Error fetching chat:', error);
            setChatMessages([]);
        }
    };

    const joinLecture = async () => {
        setJoining(true);
        try {
            // Get attendance token
            const tokenResponse = await callApi(() => lectureService.getAttendanceToken(parseInt(lectureId)));
            const token = tokenResponse.data?.token;

            if (!token) {
                throw new Error('No token received');
            }

            setAttendanceToken(token);

            // Send initial heartbeat
            await sendHeartbeat(token);

            // Start heartbeat interval (every 10 minutes)
            const interval = setInterval(() => sendHeartbeat(token), 600000);
            setHeartbeatInterval(interval);

            enqueueSnackbar('Successfully joined lecture!', { variant: 'success' });

        } catch (error) {
            if (error.response?.status === 403) {
                enqueueSnackbar('You can only attend during lecture time.', { variant: 'error' });
            } else {
                enqueueSnackbar('Failed to join lecture. Please try again.', { variant: 'error' });
            }
        } finally {
            setJoining(false);
        }
    };

    const sendHeartbeat = async (token) => {
        try {
            await lectureService.sendHeartbeat(token);
            console.log('Heartbeat sent successfully');
        } catch (error) {
            console.error('Heartbeat failed:', error);
            if (error.response?.status === 403) {
                enqueueSnackbar('Attendance check failed. You may be marked as inactive.', { variant: 'warning' });
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (!attendanceToken) {
            enqueueSnackbar('You must join the lecture first', { variant: 'warning' });
            return;
        }

        try {
            await callApi(() => chatService.sendStudentMessage(lectureId, newMessage), 'Message sent');
            fetchChat();
            setNewMessage('');
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleAnswerQuestion = async (publicationId, selectedOptionId = null, answerText = null) => {
        if (!attendanceToken) {
            enqueueSnackbar('You must join the lecture first', { variant: 'warning' });
            return;
        }

        try {
            const answerData = {
                publication_id: publicationId,
                selected_option_id: selectedOptionId,
                answer_text: answerText,
            };

            await callApi(() => questionService.submitAnswer(answerData), 'Answer submitted successfully');

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

        enqueueSnackbar('You have left the lecture', { variant: 'info' });
        navigate('/student/lectures/today');
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">Loading lecture...</p>
            </div>
        );
    }

    if (!lecture) {
        return (
            <Alert color="danger">
                <h4 className="alert-heading">Lecture not found</h4>
                <p>The lecture you're trying to access doesn't exist or you don't have permission to view it.</p>
                <Button color="primary" onClick={() => navigate('/student/lectures/today')}>
                    Back to Lectures
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
                            <Badge color="success" className="ml-2">
                                <i className="ni ni-user-run mr-1"></i>
                                LIVE
                            </Badge>
                        )}
                    </h2>
                    <p className="text-muted mb-0">
                        Section: {lecture.section?.name} | Lecture #{lecture.lecture_no} |
                        Instructor: {lecture.instructor?.full_name}
                    </p>
                </Col>
                <Col md="4" className="text-right">
                    {!attendanceToken ? (
                        <Button
                            color="primary"
                            onClick={joinLecture}
                            disabled={joining}
                        >
                            {joining ? (
                                <>
                                    <Spinner size="sm" />
                                    <span className="ml-2">Joining...</span>
                                </>
                            ) : (
                                <>
                                    <i className="ni ni-user-run mr-1"></i>
                                    Join Lecture
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button color="danger" onClick={handleLeaveLecture}>
                            <i className="ni ni-button-power mr-1"></i>
                            Leave Lecture
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
                                    <h4 className="mt-3">Ready to join the lecture?</h4>
                                    <p className="text-muted mb-4">
                                        Click the "Join Lecture" button above to begin.
                                        You'll need to stay active during the lecture to maintain your attendance.
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
                                Questions ({activeQuestions.length})
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === '2' })}
                                onClick={() => setActiveTab('2')}
                            >
                                <i className="ni ni-chat-round mr-1"></i>
                                Chat
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
                                            const expiresAt = new Date(publication.expires_at);
                                            const timeLeft = Math.max(0, Math.floor((expiresAt - new Date()) / 1000));

                                            return (
                                                <Card key={publication.id} className="mb-3 border-left-primary border-left-3">
                                                    <CardBody>
                                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                                            <div>
                                                                <h5>{question?.question_text}</h5>
                                                                <div className="d-flex align-items-center mt-2">
                                                                    <Badge color="info" className="mr-2">
                                                                        {question?.type?.replace('_', ' ').toUpperCase()}
                                                                    </Badge>
                                                                    <Badge color="success" className="mr-2">
                                                                        {question?.points || 0} points
                                                                    </Badge>
                                                                    {timeLeft > 0 && (
                                                                        <Badge color="warning">
                                                                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} remaining
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
                                                                    placeholder="Type your answer here..."
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
                                                            Submit Answer
                                                        </Button>
                                                    </CardBody>
                                                </Card>
                                            );
                                        })
                                    ) : (
                                        <Alert color="info">
                                            <i className="ni ni-bulb-61 mr-2"></i>
                                            No active questions at the moment. The instructor may publish questions during the lecture.
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
                                                <CardTitle tag="h6" className="mb-0">
                                                    <i className="ni ni-chat-round mr-2"></i>
                                                    Lecture Chat
                                                </CardTitle>
                                            </div>
                                            <div className="p-3" style={{ height: '400px', overflowY: 'auto' }}>
                                                {chatMessages.length > 0 ? (
                                                    chatMessages.map((message) => (
                                                        <div key={message.id} className={`mb-3 ${message.user?.role === 'student' ? 'text-right' : ''}`}>
                                                            <div className={`d-inline-block p-3 rounded ${message.user?.role === 'teacher' ? 'bg-light' : 'bg-primary text-white'}`} style={{ maxWidth: '80%' }}>
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <strong>{message.user?.full_name}</strong>
                                                                    <small className={message.user?.role === 'teacher' ? 'text-muted' : 'text-white-50'}>
                                                                        {new Date(message.sent_at).toLocaleTimeString([], {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </small>
                                                                </div>
                                                                <p className="mb-0">{message.message}</p>
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
                    </TabContent>
                </>
            )}
        </div>
    );
};

export default StudentLectureAttend;