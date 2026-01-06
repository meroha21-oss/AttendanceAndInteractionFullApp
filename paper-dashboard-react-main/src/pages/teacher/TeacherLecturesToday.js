import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Button,
    Table,
    Badge,
    Alert,
    Spinner
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

const TeacherLecturesToday = () => {
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();
    const { callApi } = useApi();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTodayLectures();
    }, []);

    const fetchTodayLectures = async () => {
        try {
            setLoading(true);
            const response = await callApi(() => lectureService.getTeacherTodayLectures());
            setLectures(response.data || []);
        } catch (error) {
            console.error('Error fetching today lectures:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartLecture = async (lectureId) => {
        try {
            const response = await callApi(() => lectureService.startLecture(lectureId), 'Lecture started successfully');

            if (response.data && response.data.status === 'running') {
                fetchTodayLectures();
                // Navigate to live lecture with the lecture data
                const lecture = lectures.find(l => l.id === lectureId);
                if (lecture) {
                    navigate(`/teacher/lectures/${lectureId}/live`, { state: { lecture } });
                }
            }
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleEndLecture = async (lectureId) => {
        try {
            await callApi(() => lectureService.endLecture(lectureId), 'Lecture ended successfully');
            fetchTodayLectures();
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'running':
                return <Badge color="success">LIVE</Badge>;
            case 'scheduled':
                return <Badge color="warning">SCHEDULED</Badge>;
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
            <Row className="mb-4">
                <Col>
                    <h2>Today's Lectures</h2>
                    <p className="text-muted">Manage and start your lectures for today</p>
                </Col>
            </Row>

            {lectures.length === 0 ? (
                <Alert color="info">
                    <h4 className="alert-heading">No lectures scheduled for today!</h4>
                    <p>Check your week schedule or contact administration if you should have lectures.</p>
                </Alert>
            ) : (
                <Row>
                    <Col>
                        <Card>
                            <CardBody>
                                <Table responsive hover>
                                    <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>Section</th>
                                        <th>Time</th>
                                        <th>Lecture #</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {lectures.map((lecture) => (
                                        <tr key={lecture.id}>
                                            <td>
                                                <strong>{lecture.course?.code}</strong>
                                                <br />
                                                <small>{lecture.course?.name}</small>
                                            </td>
                                            <td>{lecture.section?.name}</td>
                                            <td>
                                                {formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}
                                                <br />
                                                <small>{new Date(lecture.starts_at).toLocaleDateString()}</small>
                                            </td>
                                            <td>#{lecture.lecture_no}</td>
                                            <td>{getStatusBadge(lecture.status)}</td>
                                            <td>
                                                {lecture.status === 'scheduled' ? (
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        onClick={() => handleStartLecture(lecture.id)}
                                                    >
                                                        <i className="ni ni-user-run mr-1"></i>
                                                        Start Lecture
                                                    </Button>
                                                ) : lecture.status === 'running' ? (
                                                    <>
                                                        <Button
                                                            color="success"
                                                            size="sm"
                                                            className="mr-2"
                                                            onClick={() => navigate(`/teacher/lectures/${lecture.id}/live`, { state: { lecture } })}
                                                        >
                                                            <i className="ni ni-user-run mr-1"></i>
                                                            Enter Live
                                                        </Button>
                                                        <Button
                                                            color="danger"
                                                            size="sm"
                                                            onClick={() => handleEndLecture(lecture.id)}
                                                        >
                                                            <i className="ni ni-button-power mr-1"></i>
                                                            End
                                                        </Button>
                                                    </>
                                                ) : lecture.status === 'ended' ? (
                                                    <Button
                                                        color="info"
                                                        size="sm"
                                                        onClick={() => navigate(`/teacher/lectures/${lecture.id}/report`)}
                                                    >
                                                        <i className="ni ni-chart-bar-32 mr-1"></i>
                                                        View Report
                                                    </Button>
                                                ) : null}
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
        </div>
    );
};

export default TeacherLecturesToday;