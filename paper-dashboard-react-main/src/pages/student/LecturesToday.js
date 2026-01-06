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

const StudentLecturesToday = () => {
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const { apiRequest } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchTodaysLectures();
    }, []);

    const fetchTodaysLectures = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await apiRequest('/student/lectures/today');

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setLectures(data.data || []);
                    if (isRefresh) {
                        enqueueSnackbar("Today's lectures updated successfully!", { variant: 'success' });
                    }
                } else {
                    setError(data.message || 'Failed to fetch today\'s lectures');
                    enqueueSnackbar(data.message || 'Failed to fetch today\'s lectures', { variant: 'error' });
                }
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Network response was not ok');
                enqueueSnackbar(errorData.message || 'Failed to fetch today\'s lectures', { variant: 'error' });
            }
        } catch (error) {
            console.error('Error fetching today\'s lectures:', error);
            setError('Failed to load today\'s lectures. Please try again.');
            enqueueSnackbar('Failed to load today\'s lectures. Please try again.', { variant: 'error' });
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
        const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
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

    const isLectureUpcoming = (startsAt) => {
        const now = new Date();
        const startTime = new Date(startsAt);
        return now < startTime;
    };

    const isLectureCompleted = (endsAt) => {
        const now = new Date();
        const endTime = new Date(endsAt);
        return now > endTime;
    };

    const getLectureDuration = (startsAt, endsAt) => {
        const start = new Date(startsAt);
        const end = new Date(endsAt);
        const durationInMinutes = Math.round((end - start) / (1000 * 60));
        const hours = Math.floor(durationInMinutes / 60);
        const minutes = durationInMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} min`;
    };

    const getTimeUntilLecture = (startsAt) => {
        const now = new Date();
        const startTime = new Date(startsAt);
        const diffMs = startTime - now;

        if (diffMs <= 0) return null;

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays > 0) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        } else {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
        }
    };

    const getTodaysDate = () => {
        const today = new Date();
        return today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Card className="shadow-sm">
            <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <CardTitle tag="h5" className="mb-0">
                            Today's Lectures
                        </CardTitle>
                        <small className="text-muted">{getTodaysDate()}</small>
                    </div>
                    <Badge color="info" pill className="px-3 py-2">
                        {lectures.length} Lecture{lectures.length !== 1 ? 's' : ''}
                    </Badge>
                </div>

                {loading && !refreshing ? (
                    <div className="text-center py-5">
                        <Spinner color="primary" className="mb-3" />
                        <p className="text-muted">Loading today's lectures...</p>
                    </div>
                ) : error ? (
                    <Alert color="danger" className="text-center">
                        <p className="mb-2">{error}</p>
                        <Button
                            color="primary"
                            size="sm"
                            onClick={() => fetchTodaysLectures()}
                            disabled={loading}
                        >
                            Try Again
                        </Button>
                    </Alert>
                ) : lectures.length === 0 ? (
                    <div className="text-center py-4">
                        <div className="mb-3">
                            <i className="ni ni-calendar-grid-58 display-4 text-muted"></i>
                        </div>
                        <h6 className="text-muted">No Lectures Today</h6>
                        <p className="text-muted small">You have no scheduled lectures for today.</p>
                        <Button
                            color="outline-primary"
                            size="sm"
                            onClick={() => fetchTodaysLectures(true)}
                            disabled={refreshing}
                        >
                            {refreshing ? 'Refreshing...' : 'Check Again'}
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="mb-3">
                            <Button
                                color="outline-primary"
                                size="sm"
                                onClick={() => fetchTodaysLectures(true)}
                                disabled={refreshing}
                                className="d-flex align-items-center"
                            >
                                <i className={`ni ni-refresh mr-2 ${refreshing ? 'fa-spin' : ''}`}></i>
                                {refreshing ? 'Refreshing...' : 'Refresh'}
                            </Button>
                        </div>

                        <ListGroup flush>
                            {lectures.map((lecture) => {
                                const isLive = isLectureNow(lecture.starts_at, lecture.ends_at);
                                const isUpcoming = isLectureUpcoming(lecture.starts_at);
                                const isCompleted = isLectureCompleted(lecture.ends_at);
                                const timeUntil = getTimeUntilLecture(lecture.starts_at);

                                return (
                                    <ListGroupItem
                                        key={lecture.id}
                                        className={`py-3 border-bottom ${isLive ? 'bg-light-warning' : ''} ${isCompleted ? 'bg-light-secondary' : ''}`}
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
                                                        {isLive ? 'LIVE NOW' : getStatusText(lecture.status)}
                                                    </Badge>
                                                </div>

                                                <div className="d-flex flex-wrap align-items-center mb-2">
                                                    <Badge color="secondary" className="mr-2 mb-1">
                                                        <i className="ni ni-book-bookmark mr-1"></i>
                                                        {lecture.course?.code || 'N/A'}
                                                    </Badge>
                                                    <Badge color="light" className="mr-2 mb-1">
                                                        <i className="ni ni-sound-wave mr-1"></i>
                                                        Lecture #{lecture.lecture_no}
                                                    </Badge>
                                                    <Badge color="light" className="mb-1">
                                                        <i className="ni ni-time-alarm mr-1"></i>
                                                        {getLectureDuration(lecture.starts_at, lecture.ends_at)}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {isUpcoming && timeUntil && (
                                                <Badge color="info" pill>
                                                    In {timeUntil}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="row mb-2">
                                            <div className="col-12 col-md-6 mb-2 mb-md-0">
                                                <div className="d-flex align-items-center">
                                                    <i className="ni ni-hat-3 text-muted mr-2"></i>
                                                    <small className="text-muted">Instructor:</small>
                                                    <span className="ml-2 font-weight-medium">
                            {lecture.instructor?.full_name || 'Unknown'}
                          </span>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="d-flex align-items-center">
                                                    <i className="ni ni-bullet-list-67 text-muted mr-2"></i>
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
                                                    <i className="ni ni-time-alarm text-primary mr-2"></i>
                                                    <small className="font-weight-medium">
                                                        {formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}
                                                    </small>
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <div className="d-flex align-items-center">
                                                    <i className="ni ni-calendar-grid-58 text-primary mr-2"></i>
                                                    <small className="font-weight-medium">
                                                        {formatDate(lecture.scheduled_date)}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>

                                        {isLive && (
                                            <div className="mt-3">
                                            </div>
                                        )}

                                        {isUpcoming && (
                                            <div className="mt-3">
                                                <Button
                                                    color="outline-primary"
                                                    size="sm"
                                                    block
                                                >
                                                    <i className="ni ni-bell-55 mr-2"></i>
                                                    Set Reminder
                                                </Button>
                                            </div>
                                        )}

                                        {isCompleted && (
                                            <div className="mt-3">
                                                <Button
                                                    color="outline-success"
                                                    size="sm"
                                                    block
                                                >
                                                    <i className="ni ni-archive-2 mr-2"></i>
                                                    View Recording
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
                                        {lectures.length === 1 ? '1 lecture today' : `${lectures.length} lectures today`}
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

export default StudentLecturesToday;