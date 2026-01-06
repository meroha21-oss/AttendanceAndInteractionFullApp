import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Table,
    Badge,
    Spinner,
    Alert
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';

const TeacherLecturesWeek = () => {
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();

    useEffect(() => {
        fetchWeekLectures();
    }, []);

    const fetchWeekLectures = async () => {
        try {
            setLoading(true);
            const response = await callApi(() => lectureService.getTeacherWeekLectures());
            setLectures(response.data || []);
        } catch (error) {
            console.error('Error fetching week lectures:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            scheduled: 'info',
            running: 'warning',
            ended: 'success',
            canceled: 'danger',
        };
        return colors[status] || 'secondary';
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return 'Invalid time';
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Group lectures by day
    const groupLecturesByDay = () => {
        const grouped = {};

        lectures.forEach(lecture => {
            const date = new Date(lecture.scheduled_date).toDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(lecture);
        });

        return grouped;
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">Loading week lectures...</p>
            </div>
        );
    }

    const groupedLectures = groupLecturesByDay();
    const days = Object.keys(groupedLectures);

    return (
        <div className="container-fluid">
            <h2 className="mb-4">Week Lectures</h2>
            <p className="text-muted mb-4">This page shows all lectures for the current week.</p>

            {days.length === 0 ? (
                <Alert color="info">
                    <h4 className="alert-heading">No lectures scheduled for this week!</h4>
                    <p>Contact administration if you should have lectures scheduled.</p>
                </Alert>
            ) : (
                days.map((day, dayIndex) => (
                    <Row key={day} className="mb-4">
                        <Col>
                            <Card>
                                <CardBody>
                                    <CardTitle tag="h5" className="mb-3">
                                        <i className="ni ni-calendar-grid-58 mr-2"></i>
                                        {formatDate(day)}
                                    </CardTitle>
                                    <Table responsive hover>
                                        <thead>
                                        <tr>
                                            <th>Course</th>
                                            <th>Section</th>
                                            <th>Time</th>
                                            <th>Lecture #</th>
                                            <th>Duration</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {groupedLectures[day].map((lecture) => (
                                            <tr key={lecture.id}>
                                                <td>
                                                    <strong>{lecture.course?.code}</strong>
                                                    <div className="small">{lecture.course?.name}</div>
                                                </td>
                                                <td>{lecture.section?.name}</td>
                                                <td>
                                                    {formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}
                                                </td>
                                                <td>#{lecture.lecture_no}</td>
                                                <td>{lecture.duration_minutes || 'N/A'} min</td>
                                                <td>
                                                    <Badge color={getStatusBadge(lecture.status)}>
                                                        {lecture.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {lecture.status === 'running' ? (
                                                        <Link to={`/teacher/lectures/${lecture.id}/live`}>
                                                            <button className="btn btn-success btn-sm">
                                                                <i className="ni ni-user-run mr-1"></i>
                                                                Go Live
                                                            </button>
                                                        </Link>
                                                    ) : lecture.status === 'ended' ? (
                                                        <Link to={`/teacher/lectures/${lecture.id}/report`}>
                                                            <button className="btn btn-info btn-sm">
                                                                View Report
                                                            </button>
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted">Scheduled</span>
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
                ))
            )}
        </div>
    );
};

export default TeacherLecturesWeek;