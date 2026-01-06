import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    CardBody,
    Table,
    Button,
    Badge,
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';

const TeacherLecturesToday = () => {
    const [lectures, setLectures] = useState([]);
    const { enqueueSnackbar } = useSnackbar();
    const { loading, callApi } = useApi();

    useEffect(() => {
        fetchTodayLectures();
    }, []);

    const fetchTodayLectures = async () => {
        try {
            const response = await callApi(() => lectureService.getTeacherTodayLectures());
            setLectures(response.data);
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleStartLecture = async (lectureId) => {
        try {
            await callApi(() => lectureService.startLecture(lectureId), 'Lecture started successfully');
            fetchTodayLectures();
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
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const canStartLecture = (lecture) => {
        const now = new Date();
        const startTime = new Date(lecture.starts_at);
        // Can start 15 minutes before scheduled time
        const canStartTime = new Date(startTime.getTime() - 15 * 60000);
        return now >= canStartTime && lecture.status === 'scheduled';
    };

    return (
        <>
            <h2 className="mb-4">Today's Lectures</h2>

            <Card>
                <CardBody>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Course</th>
                            <th>Section</th>
                            <th>Time</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {lectures.map((lecture) => (
                            <tr key={lecture.id}>
                                <td>
                                    <strong>{lecture.course?.code}</strong>
                                    <div className="small">{lecture.course?.name}</div>
                                </td>
                                <td>{lecture.section?.name}</td>
                                <td>
                                    {formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}
                                </td>
                                <td>{lecture.duration_minutes} min</td>
                                <td>
                                    <Badge color={getStatusBadge(lecture.status)}>
                                        {lecture.status}
                                    </Badge>
                                </td>
                                <td>
                                    {lecture.status === 'scheduled' && canStartLecture(lecture) && (
                                        <Button
                                            color="primary"
                                            size="sm"
                                            onClick={() => handleStartLecture(lecture.id)}
                                            disabled={loading}
                                        >
                                            Start
                                        </Button>
                                    )}
                                    {lecture.status === 'running' && (
                                        <>
                                            <Button
                                                color="success"
                                                size="sm"
                                                className="mr-2"
                                                tag={Link}
                                                to={`/teacher/lectures/${lecture.id}/live`}
                                            >
                                                Go Live
                                            </Button>
                                            <Button
                                                color="danger"
                                                size="sm"
                                                onClick={() => handleEndLecture(lecture.id)}
                                                disabled={loading}
                                            >
                                                End
                                            </Button>
                                        </>
                                    )}
                                    {lecture.status === 'ended' && (
                                        <Button
                                            color="info"
                                            size="sm"
                                            tag={Link}
                                            to={`/teacher/lectures/${lecture.id}/report`}
                                        >
                                            View Report
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>
        </>
    );
};

export default TeacherLecturesToday;