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
import { Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard = () => {
    const [todayLectures, setTodayLectures] = useState([]);
    const [weekLectures, setWeekLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();
    const { callApi } = useApi();

    useEffect(() => {
        fetchTodayLectures();
        fetchWeekLectures();
    }, []);

    const fetchTodayLectures = async () => {
        try {
            const response = await callApi(() => lectureService.getStudentTodayLectures());
            setTodayLectures(response.data || []);
        } catch (error) {
            console.error('Error fetching today lectures:', error);
            setTodayLectures([]);
        }
    };

    const fetchWeekLectures = async () => {
        try {
            const response = await callApi(() => lectureService.getStudentWeekLectures());
            setWeekLectures(response.data || []);
        } catch (error) {
            console.error('Error fetching week lectures:', error);
            setWeekLectures([]);
        } finally {
            setLoading(false);
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'running':
                return <Badge color="success">LIVE</Badge>;
            case 'scheduled':
                return <Badge color="warning">UPCOMING</Badge>;
            case 'ended':
                return <Badge color="secondary">ENDED</Badge>;
            default:
                return <Badge color="info">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">Loading lectures...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Welcome Section */}
            <Row className="mb-4">
                <Col>
                    <Card className="bg-gradient-primary text-white">
                        <CardBody>
                            <Row>
                                <Col md="8">
                                    <h2>Welcome, {user?.full_name || 'Student'}!</h2>
                                    <p className="mb-0">
                                        You have {todayLectures.length} lecture{todayLectures.length !== 1 ? 's' : ''} today.
                                        {todayLectures.filter(l => l.status === 'running').length > 0 &&
                                            ` ${todayLectures.filter(l => l.status === 'running').length} are currently LIVE!`
                                        }
                                    </p>
                                </Col>
                                <Col md="4" className="text-right">
                                    <Button color="light" outline tag={Link} to="/student/lectures/today">
                                        View Today's Lectures
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Today's Running Lectures */}
            {todayLectures.filter(l => l.status === 'running').length > 0 && (
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <CardBody>
                                <CardTitle tag="h4" className="mb-3">
                                    <i className="ni ni-user-run text-success mr-2"></i>
                                    Join Now - Live Lectures
                                </CardTitle>
                                <Table responsive hover>
                                    <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Section</th>
                                        <th>Time</th>
                                        <th>Instructor</th>
                                        <th>Action</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {todayLectures
                                        .filter(l => l.status === 'running')
                                        .map((lecture) => (
                                            <tr key={lecture.id}>
                                                <td>
                                                    <strong>{lecture.course?.code || 'N/A'}</strong>
                                                    <div className="small">{lecture.course?.name || 'Unknown Course'}</div>
                                                </td>
                                                <td>{lecture.section?.name || 'N/A'}</td>
                                                <td>
                                                    {formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}
                                                </td>
                                                <td>{lecture.instructor?.full_name || 'Unknown'}</td>
                                                <td>
                                                    <Button
                                                        color="success"
                                                        size="sm"
                                                        tag={Link}
                                                        to={`/student/lecture/attend/${lecture.id}`}
                                                    >
                                                        <i className="ni ni-user-run mr-1"></i>
                                                        Join Lecture
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

            {/* Today's Scheduled Lectures */}
            {todayLectures.filter(l => l.status === 'scheduled').length > 0 && (
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <CardBody>
                                <CardTitle tag="h4" className="mb-3">
                                    <i className="ni ni-watch-time text-warning mr-2"></i>
                                    Upcoming Today
                                </CardTitle>
                                <Table responsive hover>
                                    <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Section</th>
                                        <th>Start Time</th>
                                        <th>Instructor</th>
                                        <th>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {todayLectures
                                        .filter(l => l.status === 'scheduled')
                                        .map((lecture) => {
                                            try {
                                                const startTime = new Date(lecture.starts_at);
                                                const now = new Date();
                                                const timeUntilStart = Math.floor((startTime - now) / 60000);

                                                return (
                                                    <tr key={lecture.id}>
                                                        <td>
                                                            <strong>{lecture.course?.code || 'N/A'}</strong>
                                                            <div className="small">{lecture.course?.name || 'Unknown Course'}</div>
                                                        </td>
                                                        <td>{lecture.section?.name || 'N/A'}</td>
                                                        <td>
                                                            {formatTime(lecture.starts_at)}
                                                            {timeUntilStart > 0 && timeUntilStart <= 30 && (
                                                                <div className="small text-warning">
                                                                    Starts in {timeUntilStart} minutes
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>{lecture.instructor?.full_name || 'Unknown'}</td>
                                                        <td>
                                                            <Badge color="warning">
                                                                {timeUntilStart > 0
                                                                    ? `Starts in ${timeUntilStart}m`
                                                                    : 'Starting soon'
                                                                }
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            } catch (error) {
                                                return null;
                                            }
                                        })}
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
                                        <CardTitle tag="h3">
                                            {todayLectures.filter(l => l.status === 'running').length}
                                        </CardTitle>
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
                                        <i className="ni ni-book-bookmark text-info"></i>
                                    </div>
                                </Col>
                                <Col xs="7">
                                    <div className="numbers">
                                        <p className="card-category">This Week</p>
                                        <CardTitle tag="h3">{weekLectures.length}</CardTitle>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* No Lectures Message */}
            {todayLectures.length === 0 && (
                <Row>
                    <Col>
                        <Alert color="info">
                            <h4 className="alert-heading">No lectures scheduled for today!</h4>
                            <p>Enjoy your day off! Check back later or view your week schedule.</p>
                            <hr />
                            <Button color="primary" tag={Link} to="/student/lectures/week">
                                View Week Schedule
                            </Button>
                        </Alert>
                    </Col>
                </Row>
            )}
        </div>
    );
};

export default StudentDashboard;