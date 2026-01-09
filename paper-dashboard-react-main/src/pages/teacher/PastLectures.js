import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    CardTitle,
    Row,
    Col,
    Table,
    Badge,
    Alert,
    Spinner,
    Button
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';

const PastLectures = () => {
    const navigate = useNavigate();
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();

    useEffect(() => {
        fetchPastLectures();
    }, []);

    const fetchPastLectures = async () => {
        try {
            setLoading(true);
            const response = await callApi(() => lectureService.getPastLectures());
            setLectures(response.data || []);
        } catch (error) {
            console.error('Error fetching past lectures:', error);
            enqueueSnackbar('Failed to load past lectures', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">Loading past lectures...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <Row className="mb-4">
                <Col>
                    <h2>Past Lectures</h2>
                    <p className="text-muted">View reports for completed lectures</p>
                </Col>
            </Row>

            {lectures.length > 0 ? (
                <Row>
                    <Col>
                        <Table responsive hover>
                            <thead>
                            <tr>
                                <th>Lecture #</th>
                                <th>Course</th>
                                <th>Section</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Attendance</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {lectures.map((lecture) => (
                                <tr key={lecture.id}>
                                    <td>#{lecture.lecture_no}</td>
                                    <td>
                                        <strong>{lecture.course.code}</strong>
                                        <br />
                                        <small>{lecture.course.name}</small>
                                    </td>
                                    <td>{lecture.section.name}</td>
                                    <td>{formatDate(lecture.scheduled_date)}</td>
                                    <td>
                                        <Badge color={lecture.status === 'ended' ? 'success' : 'secondary'}>
                                            {lecture.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex">
                                            <Badge color="success" className="mr-1">
                                                {lecture.stats?.present_or_late || 0}
                                            </Badge>
                                            <Badge color="danger" className="mr-1">
                                                {lecture.stats?.absent || 0}
                                            </Badge>
                                            <Badge color="info">
                                                {lecture.stats?.left || 0}
                                            </Badge>
                                        </div>
                                    </td>
                                    <td>
                                        <Button
                                            color="primary"
                                            size="sm"
                                            onClick={() => navigate(`/teacher/lectures/report/${lecture.id}`)}
                                        >
                                            View Report
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            ) : (
                <Alert color="info">
                    No past lectures found.
                </Alert>
            )}
        </div>
    );
};

export default PastLectures;