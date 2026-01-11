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
    Button,
    Input,
    InputGroup,
    InputGroupText,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';
import { FiFilter, FiSearch, FiCalendar, FiClock, FiEye } from 'react-icons/fi';
import { FaChalkboardTeacher } from 'react-icons/fa';

const PastLectures = () => {
    const navigate = useNavigate();
    const [lectures, setLectures] = useState([]);
    const [filteredLectures, setFilteredLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('all'); // 'all', 'today', 'week', 'month'
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();

    useEffect(() => {
        fetchPastLectures();
    }, []);

    useEffect(() => {
        filterLectures();
    }, [lectures, searchTerm, filterBy]);

    const fetchPastLectures = async () => {
        try {
            setLoading(true);
            const response = await callApi(() => lectureService.getPastLectures());
            setLectures(response.data || []);
            setFilteredLectures(response.data || []);
        } catch (error) {
            console.error('Error fetching past lectures:', error);
            enqueueSnackbar('Failed to load past lectures', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filterLectures = () => {
        let filtered = [...lectures];

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(lecture =>
                lecture.course.code.toLowerCase().includes(term) ||
                lecture.course.name.toLowerCase().includes(term) ||
                lecture.section.name.toLowerCase().includes(term) ||
                lecture.lecture_no.toString().includes(term)
            );
        }

        // Filter by time period
        const now = new Date();
        filtered = filtered.filter(lecture => {
            const lectureDate = new Date(lecture.scheduled_date);

            switch (filterBy) {
                case 'today':
                    return lectureDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now);
                    weekAgo.setDate(now.getDate() - 7);
                    return lectureDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(now.getMonth() - 1);
                    return lectureDate >= monthAgo;
                default:
                    return true;
            }
        });

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));

        setFilteredLectures(filtered);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return 'Invalid time';
        }
    };

    const getDuration = (startsAt, endsAt) => {
        if (!startsAt || !endsAt) return 'N/A';
        try {
            const start = new Date(startsAt);
            const end = new Date(endsAt);
            const durationMs = end - start;
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        } catch (error) {
            return 'N/A';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ended': return 'success';
            case 'cancelled': return 'danger';
            case 'scheduled': return 'warning';
            default: return 'secondary';
        }
    };

    const toggleDropdown = () => setDropdownOpen(prevState => !prevState);

    const getAttendancePercentage = (lecture) => {
        if (!lecture.stats) return 0;
        const total = lecture.stats.present_or_late + lecture.stats.absent + lecture.stats.left;
        if (total === 0) return 0;
        return Math.round((lecture.stats.present_or_late / total) * 100);
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
                    <h2 className="d-flex align-items-center">
                        <FaChalkboardTeacher className="mr-2" />
                        Past Lectures
                    </h2>
                    <p className="text-muted">View attendance and interaction reports for completed lectures</p>
                </Col>
            </Row>

            {/* Filters and Search */}
            <Card className="mb-4">
                <CardBody>
                    <Row className="align-items-center">
                        <Col md="6">
                            <InputGroup>
                                <InputGroupText>
                                    <FiSearch />
                                </InputGroupText>
                                <Input
                                    placeholder="Search by course code, name, or section..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md="3">
                            <InputGroup>
                                <InputGroupText>
                                    <FiFilter />
                                </InputGroupText>
                                <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                                    <DropdownToggle caret className="w-100">
                                        {filterBy === 'all' ? 'All Lectures' :
                                            filterBy === 'today' ? 'Today' :
                                                filterBy === 'week' ? 'Last 7 days' :
                                                    'Last 30 days'}
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem onClick={() => setFilterBy('all')}>
                                            All Lectures
                                        </DropdownItem>
                                        <DropdownItem onClick={() => setFilterBy('today')}>
                                            Today
                                        </DropdownItem>
                                        <DropdownItem onClick={() => setFilterBy('week')}>
                                            Last 7 days
                                        </DropdownItem>
                                        <DropdownItem onClick={() => setFilterBy('month')}>
                                            Last 30 days
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </InputGroup>
                        </Col>
                        <Col md="3" className="text-right">
                            <Button color="primary" onClick={fetchPastLectures}>
                                Refresh
                            </Button>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {filteredLectures.length > 0 ? (
                <>
                    {/* Summary Cards */}
                    <Row className="mb-4">
                        <Col md="3">
                            <Card className="bg-gradient-primary text-white">
                                <CardBody className="py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-uppercase mb-0">Total Lectures</h6>
                                            <h2 className="mb-0">{filteredLectures.length}</h2>
                                        </div>
                                        <FiCalendar size={30} />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md="3">
                            <Card className="bg-gradient-success text-white">
                                <CardBody className="py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-uppercase mb-0">Avg. Attendance</h6>
                                            <h2 className="mb-0">
                                                {Math.round(
                                                    filteredLectures.reduce((acc, lecture) =>
                                                        acc + getAttendancePercentage(lecture), 0
                                                    ) / filteredLectures.length
                                                )}%
                                            </h2>
                                        </div>
                                        <FiClock size={30} />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md="3">
                            <Card className="bg-gradient-info text-white">
                                <CardBody className="py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-uppercase mb-0">Total Students</h6>
                                            <h2 className="mb-0">
                                                {filteredLectures.reduce((acc, lecture) =>
                                                    acc + (lecture.stats?.present_or_late || 0) +
                                                    (lecture.stats?.absent || 0) +
                                                    (lecture.stats?.left || 0), 0
                                                )}
                                            </h2>
                                        </div>
                                        <FaChalkboardTeacher size={30} />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md="3">
                            <Card className="bg-gradient-warning text-white">
                                <CardBody className="py-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 className="text-uppercase mb-0">Active Courses</h6>
                                            <h2 className="mb-0">
                                                {[...new Set(filteredLectures.map(l => l.course.code))].length}
                                            </h2>
                                        </div>
                                        <FiEye size={30} />
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Lectures Table */}
                    <Card>
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <CardTitle tag="h5" className="mb-0">
                                    Completed Lectures ({filteredLectures.length})
                                </CardTitle>
                                <small className="text-muted">
                                    Showing {filteredLectures.length} of {lectures.length} lectures
                                </small>
                            </div>

                            <div className="table-responsive">
                                <Table hover className="align-middle">
                                    <thead className="thead-light">
                                    <tr>
                                        <th>Lecture #</th>
                                        <th>Course & Section</th>
                                        <th>Date & Time</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th>Attendance</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredLectures.map((lecture) => (
                                        <tr key={lecture.id} className="cursor-pointer">
                                            <td>
                                                <div className="font-weight-bold">#{lecture.lecture_no}</div>
                                                <small className="text-muted">ID: {lecture.id}</small>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <strong className="text-primary">
                                                        {lecture.course.code}
                                                    </strong>
                                                    <span className="text-muted small">
                                                            {lecture.course.name}
                                                        </span>
                                                    <span className="badge badge-light mt-1">
                                                            {lecture.section.name}
                                                        </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                        <span className="font-weight-bold">
                                                            <FiCalendar className="mr-1" />
                                                            {formatDate(lecture.scheduled_date)}
                                                        </span>
                                                    <small className="text-muted">
                                                        <FiClock className="mr-1" />
                                                        {formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}
                                                    </small>
                                                    {lecture.ended_at && (
                                                        <small className="text-success">
                                                            Ended: {formatTime(lecture.ended_at)}
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge color="info" pill className="px-3 py-2">
                                                    {getDuration(lecture.starts_at, lecture.ends_at)}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge
                                                    color={getStatusColor(lecture.status)}
                                                    pill
                                                    className="px-3 py-2 text-capitalize"
                                                >
                                                    {lecture.status}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <div className="mb-1">
                                                        <div className="d-flex justify-content-between">
                                                            <small>Present/Late:</small>
                                                            <strong className="text-success">
                                                                {lecture.stats?.present_or_late || 0}
                                                            </strong>
                                                        </div>
                                                        <div className="progress" style={{ height: '4px' }}>
                                                            <div
                                                                className="progress-bar bg-success"
                                                                style={{
                                                                    width: `${getAttendancePercentage(lecture)}%`
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="d-flex justify-content-between small">
                                                            <span className="text-danger">
                                                                Absent: {lecture.stats?.absent || 0}
                                                            </span>
                                                        <span className="text-info">
                                                                Left: {lecture.stats?.left || 0}
                                                            </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Button
                                                    color="primary"
                                                    size="sm"
                                                    onClick={() => navigate(`/teacher/lectures/past/${lecture.id}`)}
                                                    className="d-flex align-items-center"
                                                >
                                                    <FiEye className="mr-1" />
                                                    View Report
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>
                </>
            ) : (
                <Alert color="info" className="text-center">
                    <h4 className="alert-heading">No lectures found</h4>
                    <p>
                        {searchTerm
                            ? `No lectures found matching "${searchTerm}"`
                            : 'There are no past lectures to display for the selected filter.'
                        }
                    </p>
                    {(searchTerm || filterBy !== 'all') && (
                        <Button
                            color="primary"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterBy('all');
                            }}
                        >
                            Clear filters
                        </Button>
                    )}
                </Alert>
            )}
        </div>
    );
};

export default PastLectures;