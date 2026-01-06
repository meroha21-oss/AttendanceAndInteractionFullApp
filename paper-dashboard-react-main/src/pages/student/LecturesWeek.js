import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardTitle,
    ListGroup,
    ListGroupItem,
    Badge,
    Button,
    Spinner,
    Alert
} from 'reactstrap';
import { useAuth } from '../../contexts/AuthContext'; // تأكد من المسار الصحيح
import { useSnackbar } from 'notistack';
import { FaCalendarAlt, FaUserTie, FaBook, FaClock, FaSync, FaChalkboardTeacher } from 'react-icons/fa';

const StudentLecturesWeek = () => {
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const { apiRequest } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchWeeklyLectures();
    }, []);

    const fetchWeeklyLectures = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await apiRequest('/student/lectures/week');

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setLectures(data.data || []);
                    if (isRefresh) {
                        enqueueSnackbar('Lectures updated successfully!', { variant: 'success' });
                    }
                } else {
                    setError(data.message || 'Failed to fetch lectures');
                    enqueueSnackbar(data.message || 'Failed to fetch lectures', { variant: 'error' });
                }
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Network response was not ok');
                enqueueSnackbar(errorData.message || 'Failed to fetch lectures', { variant: 'error' });
            }
        } catch (error) {
            console.error('Error fetching weekly lectures:', error);
            setError('Failed to load lectures. Please try again.');
            enqueueSnackbar('Failed to load lectures. Please try again.', { variant: 'error' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatTime = (dateTimeString) => {
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const getStatusColor = (status) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'completed':
                return 'success';
            case 'ongoing':
                return 'warning';
            case 'scheduled':
                return 'primary';
            case 'cancelled':
                return 'danger';
            default:
                return 'secondary';
        }
    };

    const getStatusText = (status) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'completed':
                return 'Completed';
            case 'ongoing':
                return 'Live Now';
            case 'scheduled':
                return 'Upcoming';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    const isLectureNow = (startsAt, endsAt) => {
        const now = new Date();
        const startTime = new Date(startsAt);
        const endTime = new Date(endsAt);
        return now >= startTime && now <= endTime;
    };

    const getLectureDuration = (startsAt, endsAt) => {
        const start = new Date(startsAt);
        const end = new Date(endsAt);
        const durationInMinutes = Math.round((end - start) / (1000 * 60));
        return `${durationInMinutes} min`;
    };

    return (
        <Card className="shadow-sm">
            <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <CardTitle tag="h5" className="mb-0">
                        <FaCalendarAlt className="mr-2" />
                        This Week's Lectures
                    </CardTitle>
                    <Badge color="info" pill className="px-3 py-2">
                        {lectures.length} Lecture{lectures.length !== 1 ? 's' : ''}
                    </Badge>
                </div>

                {loading && !refreshing ? (
                    <div className="text-center py-5">
                        <Spinner color="primary" className="mb-3" />
                        <p className="text-muted">Loading lectures...</p>
                    </div>
                ) : error ? (
                    <Alert color="danger" className="text-center">
                        <p className="mb-2">{error}</p>
                        <Button
                            color="primary"
                            size="sm"
                            onClick={() => fetchWeeklyLectures()}
                            disabled={loading}
                        >
                            <FaSync className="mr-2" />
                            Try Again
                        </Button>
                    </Alert>
                ) : lectures.length === 0 ? (
                    <div className="text-center py-4">
                        <FaBook size={48} className="text-muted mb-3" />
                        <h6 className="text-muted">No Lectures This Week</h6>
                        <p className="text-muted small">You have no scheduled lectures for this week.</p>
                        <Button
                            color="outline-primary"
                            size="sm"
                            onClick={() => fetchWeeklyLectures(true)}
                            disabled={refreshing}
                        >
                            <FaSync className="mr-2" />
                            Check Again
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="mb-3">
                            <Button
                                color="outline-primary"
                                size="sm"
                                onClick={() => fetchWeeklyLectures(true)}
                                disabled={refreshing}
                                className="d-flex align-items-center"
                            >
                                <FaSync className={`mr-2 ${refreshing ? 'fa-spin' : ''}`} />
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </Button>
                        </div>

                        <ListGroup flush>
                            {lectures.map((lecture) => {
                                const isLive = isLectureNow(lecture.starts_at, lecture.ends_at);

                                return (
                                    <ListGroupItem
                                        key={lecture.id}
                                        className={`py-3 border-bottom ${isLive ? 'bg-light-warning' : ''}`}
                                    >
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center mb-2">
                                                    <h6 className="mb-0 mr-2">
                                                        {lecture.course?.name || 'Unknown Course'}
                                                    </h6>
                                                    <Badge
                                                        color={getStatusColor(lecture.status)}
                                                        pill
                                                        className={isLive ? 'animate-pulse' : ''}
                                                    >
                                                        {isLive ? 'LIVE' : getStatusText(lecture.status)}
                                                    </Badge>
                                                </div>

                                                <div className="d-flex flex-wrap align-items-center mb-2">
                                                    <Badge color="secondary" className="mr-2 mb-1">
                                                        <FaBook className="mr-1" size={12} />
                                                        {lecture.course?.code || 'N/A'}
                                                    </Badge>
                                                    <Badge color="light" className="mr-2 mb-1">
                                                        <FaChalkboardTeacher className="mr-1" size={12} />
                                                        Lecture #{lecture.lecture_no}
                                                    </Badge>
                                                    <Badge color="light" className="mb-1">
                                                        <FaClock className="mr-1" size={12} />
                                                        {getLectureDuration(lecture.starts_at, lecture.ends_at)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row mb-2">
                                            <div className="col-12 col-md-6 mb-2 mb-md-0">
                                                <div className="d-flex align-items-center">
                                                    <FaUserTie className="text-muted mr-2" size={14} />
                                                    <small className="text-muted">Instructor:</small>
                                                    <span className="ml-2 font-weight-medium">
                            {lecture.instructor?.full_name || 'Unknown'}
                          </span>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="d-flex align-items-center">
                                                    <FaCalendarAlt className="text-muted mr-2" size={14} />
                                                    <small className="text-muted">Section:</small>
                                                    <span className="ml-2 font-weight-medium">
                            {lecture.section?.name || 'N/A'}
                          </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-12 col-md-6 mb-2 mb-md-0">
                                                <div className="d-flex align-items-center">
                                                    <FaClock className="text-primary mr-2" size={14} />
                                                    <small className="font-weight-medium">
                                                        {formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}
                                                    </small>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="d-flex align-items-center">
                                                    <FaCalendarAlt className="text-primary mr-2" size={14} />
                                                    <small className="font-weight-medium">
                                                        {formatDate(lecture.scheduled_date)}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>

                                        {isLive && (
                                            <div className="mt-3">
                                                <Button
                                                    color="warning"
                                                    size="sm"
                                                    block
                                                    className="font-weight-bold"
                                                >
                                                    JOIN LECTURE NOW
                                                </Button>
                                            </div>
                                        )}
                                    </ListGroupItem>
                                );
                            })}
                        </ListGroup>

                        <div className="mt-4 pt-3 border-top">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <small className="text-muted">
                                        Showing {lectures.length} lecture{lectures.length !== 1 ? 's' : ''} for this week
                                    </small>
                                </div>
                                <div className="text-right">
                                    <small className="text-muted">
                                        Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
};

export default StudentLecturesWeek;