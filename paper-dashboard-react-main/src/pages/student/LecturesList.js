import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardText,
    Button,
    Table,
    Badge,
    Alert,
    Spinner
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';

const LecturesList = () => {
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();

    useEffect(() => {
        fetchLectures();
    }, []);

    const fetchLectures = async () => {
        try {
            setLoading(true);
            const response = await callApi(() => lectureService.getStudentLectures());
            setLectures(response.data);
        } catch (error) {
            enqueueSnackbar('Failed to load lectures', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <Row className="mb-4">
                <Col>
                    <h2>My Lectures</h2>
                    <p className="text-muted">View and attend your scheduled lectures</p>
                </Col>
            </Row>

            {lectures.length === 0 ? (
                <Alert color="info">
                    No lectures scheduled at the moment. Please check back later.
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
                                        <th>Lecture #</th>
                                        <th>Time</th>
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
                                            <td>#{lecture.lecture_no}</td>
                                            <td>
                                                {new Date(lecture.starts_at).toLocaleDateString()}
                                                <br />
                                                <small>{formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}</small>
                                            </td>
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
                                                ) : (
                                                    <Button color="light" size="sm" disabled>
                                                        <i className="ni ni-check-bold mr-1"></i>
                                                        Ended
                                                    </Button>
                                                )}
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

export default LecturesList;