import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const StudentLecturesToday = () => {
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();
    const { callApi } = useApi();

    useEffect(() => {
        fetchTodayLectures();
    }, []);

    const fetchTodayLectures = async () => {
        try {
            setLoading(true);
            const response = await callApi(() => lectureService.getStudentTodayLectures());
            setLectures(response.data || []);
        } catch (error) {
            console.error('Error fetching today lectures:', error);
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
                    <p className="text-muted">Join your scheduled lectures for today</p>
                </Col>
            </Row>

            {lectures.length === 0 ? (
                <Alert color="info">
                    <h4 className="alert-heading">No lectures scheduled for today!</h4>
                    <p>Enjoy your day! Check your week schedule for upcoming lectures.</p>
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
                                        <th>Instructor</th>
                                        <th>Status</th>
                                        <th>Action</th>
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
                                            <td>{lecture.instructor?.full_name}</td>
                                            <td>{getStatusBadge(lecture.status)}</td>
                                            <td>
                                                {lecture.status === 'running' ? (
                                                    <Link to={`/student/lecture/attend/${lecture.id}`}>
                                                        <Button color="primary" size="sm">
                                                            <i className="ni ni-user-run mr-1"></i>
                                                            Join Lecture
                                                        </Button>
                                                    </Link>
                                                ) : lecture.status === 'scheduled' ? (
                                                    <Button color="secondary" size="sm" disabled>
                                                        <i className="ni ni-watch-time mr-1"></i>
                                                        Starts Soon
                                                    </Button>
                                                ) : lecture.status === 'ended' ? (
                                                    <Button color="light" size="sm" disabled>
                                                        <i className="ni ni-check-bold mr-1"></i>
                                                        Ended
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

export default StudentLecturesToday;