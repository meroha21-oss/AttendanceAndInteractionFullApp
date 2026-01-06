import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardText,
    Table,
    Button,
    Badge,
    Alert,
    Spinner
} from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

const TeacherDashboard = () => {
    const [todayLectures, setTodayLectures] = useState([]);
    const [runningLectures, setRunningLectures] = useState([]);
    const [weekLectures, setWeekLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();
    const { callApi } = useApi();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchTodayLectures(),
                fetchWeekLectures()
            ]);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTodayLectures = async () => {
        try {
            const response = await callApi(() => lectureService.getTeacherTodayLectures());
            const lectures = response.data || [];
            setTodayLectures(lectures);
            setRunningLectures(lectures.filter(l => l.status === 'running'));
        } catch (error) {
            console.error('Error fetching today lectures:', error);
        }
    };

    const fetchWeekLectures = async () => {
        try {
            const response = await callApi(() => lectureService.getTeacherWeekLectures());
            setWeekLectures(response.data || []);
        } catch (error) {
            console.error('Error fetching week lectures:', error);
        }
    };

    const handleStartLecture = async (lectureId) => {
        try {
            const response = await callApi(() => lectureService.startLecture(lectureId), 'Lecture started successfully');

            if (response.data && response.data.status === 'running') {
                fetchTodayLectures();
                setTimeout(() => {
                    navigate(`/teacher/lectures/${lectureId}/live`);
                }, 500);
            }
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return 'Invalid time';
        }
    };

    const canStartLecture = (lecture) => {
        if (lecture.status !== 'scheduled') return false;

        const now = new Date();
        const startTime = new Date(lecture.starts_at);
        const fifteenMinutesBefore = new Date(startTime.getTime() - 15 * 60000);

        return now >= fifteenMinutesBefore;
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <h2 className="mb-4">Teacher Dashboard</h2>

            {/* Welcome Card */}
            <Card className="mb-4 bg-gradient-primary text-white">
                <CardBody>
                    <Row>
                        <Col md="8">
                            <h4>Welcome, {user?.full_name}!</h4>
                            <p className="mb-0">
                                You have {todayLectures.length} lecture{todayLectures.length !== 1 ? 's' : ''} today.
                                {runningLectures.length > 0 && ` ${runningLectures.length} are currently LIVE!`}
                            </p>
                        </Col>
                        <Col md="4" className="text-right">
                            <Button color="light" tag={Link} to="/teacher/lectures/today">
                                View Today's Lectures
                            </Button>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {/* Running Lectures */}
            {runningLectures.length > 0 && (
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <CardBody>
                                <CardTitle tag="h5">
                                    <i className="ni ni-user-run text-success mr-2"></i>
                                    Live Lectures
                                </CardTitle>
                                <Table responsive>
                                    <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Section</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {runningLectures.map((lecture) => (
                                        <tr key={lecture.id}>
                                            <td>
                                                <strong>{lecture.course?.code}</strong>
                                                <div className="small">{lecture.course?.name}</div>
                                            </td>
                                            <td>{lecture.section?.name}</td>
                                            <td>
                                                {formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}
                                            </td>
                                            <td>
                                                <Badge color="success">LIVE</Badge>
                                            </td>
                                            <td>
                                                <Button
                                                    color="success"
                                                    size="sm"
                                                    onClick={() => navigate(`/teacher/lectures/${lecture.id}/live`, { state: { lecture } })}
                                                >
                                                    <i className="ni ni-user-run mr-1"></i>
                                                    Enter Lecture
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Quick Stats */}
            <Row className="mb-4">
                <Col md="4">
                    <Card className="card-stats">
                        <CardBody>
                            <Row>
                                <Col xs="5">
                                    <div className="icon-big text-center icon-warning">
                                        <i className="ni ni-calendar-grid-58 text-warning"></i>
                                    </div>
                                </Col>
                                <Col xs="7">
                                    <div className="numbers">
                                        <p className="card-category">Today's Lectures</p>
                                        <CardTitle tag="h3">{todayLectures.length}</CardTitle>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
                <Col md="4">
                    <Card className="card-stats">
                        <CardBody>
                            <Row>
                                <Col xs="5">
                                    <div className="icon-big text-center icon-warning">
                                        <i className="ni ni-user-run text-success"></i>
                                    </div>
                                </Col>
                                <Col xs="7">
                                    <div className="numbers">
                                        <p className="card-category">Live Now</p>
                                        <CardTitle tag="h3">{runningLectures.length}</CardTitle>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
                <Col md="4">
                    <Card className="card-stats">
                        <CardBody>
                            <Row>
                                <Col xs="5">
                                    <div className="icon-big text-center icon-warning">
                                        <i className="ni ni-single-02 text-info"></i>
                                    </div>
                                </Col>
                                <Col xs="7">
                                    <div className="numbers">
                                        <p className="card-category">Students</p>
                                        <CardTitle tag="h3">
                                            {runningLectures.length > 0 ? 'Online' : '0'}
                                        </CardTitle>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Scheduled Lectures */}
            {todayLectures.filter(l => l.status === 'scheduled').length > 0 && (
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <CardBody>
                                <CardTitle tag="h5">
                                    <i className="ni ni-watch-time text-warning mr-2"></i>
                                    Upcoming Lectures Today
                                </CardTitle>
                                <Table responsive>
                                    <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Section</th>
                                        <th>Start Time</th>
                                        <th>Lecture #</th>
                                        <th>Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {todayLectures
                                        .filter(l => l.status === 'scheduled')
                                        .map((lecture) => {
                                            const startTime = new Date(lecture.starts_at);
                                            const now = new Date();
                                            const timeUntilStart = Math.floor((startTime - now) / 60000);

                                            return (
                                                <tr key={lecture.id}>
                                                    <td>
                                                        <strong>{lecture.course?.code}</strong>
                                                        <div className="small">{lecture.course?.name}</div>
                                                    </td>
                                                    <td>{lecture.section?.name}</td>
                                                    <td>
                                                        {formatTime(lecture.starts_at)}
                                                        {timeUntilStart > 0 && timeUntilStart <= 30 && (
                                                            <div className="small text-warning">
                                                                Starts in {timeUntilStart} minutes
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>#{lecture.lecture_no}</td>
                                                    <td>
                                                        {timeUntilStart > -15 && timeUntilStart <= 30 ? (
                                                            <Button
                                                                color="primary"
                                                                size="sm"
                                                                onClick={() => handleStartLecture(lecture.id)}
                                                            >
                                                                <i className="ni ni-user-run mr-1"></i>
                                                                Start Lecture
                                                            </Button>
                                                        ) : timeUntilStart > 30 ? (
                                                            <Badge color="warning">
                                                                Starts in {timeUntilStart}m
                                                            </Badge>
                                                        ) : (
                                                            <Button
                                                                color="primary"
                                                                size="sm"
                                                                onClick={() => handleStartLecture(lecture.id)}
                                                            >
                                                                <i className="ni ni-user-run mr-1"></i>
                                                                Start Now
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* No Lectures Message */}
            {todayLectures.length === 0 && (
                <Row>
                    <Col>
                        <Alert color="info">
                            <h4 className="alert-heading">No lectures scheduled for today!</h4>
                            <p>Check your week schedule or contact administration if you should have lectures.</p>
                            <hr />
                            <Button color="primary" tag={Link} to="/teacher/lectures/week">
                                View Week Schedule
                            </Button>
                        </Alert>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default TeacherDashboard;