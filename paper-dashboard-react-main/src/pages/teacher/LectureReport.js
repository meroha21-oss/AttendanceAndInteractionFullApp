import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import classnames from 'classnames';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';

const LectureReport = () => {
    const { lectureId } = useParams();
    const navigate = useNavigate();
    const [lectureData, setLectureData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('1'); // '1' for attendance, '2' for questions
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();

    const fetchLectureData = async () => {
        try {
            setLoading(true);
            const response = await callApi(() => lectureService.getPastLectureById(lectureId));
            setLectureData(response.data);
        } catch (error) {
            console.error('Error fetching lecture report:', error);
            enqueueSnackbar('Failed to load lecture report', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!lectureId || isNaN(lectureId)) {
            enqueueSnackbar('Invalid lecture ID', { variant: 'error' });
            navigate('/teacher/dashboard');
            return;
        }

        fetchLectureData();
    }, [lectureId]); // إزالة enqueueSnackbar و navigate من المصفوفة

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid time';
        }
    };

    const getAttendanceStatusBadge = (status) => {
        switch (status) {
            case 'present':
                return <Badge color="success">Present</Badge>;
            case 'absent':
                return <Badge color="danger">Absent</Badge>;
            case 'late':
                return <Badge color="warning">Late</Badge>;
            case 'left':
                return <Badge color="info">Left</Badge>;
            default:
                return <Badge color="secondary">{status}</Badge>;
        }
    };

    const getAnswerStatusBadge = (isCorrect, answered) => {
        if (!answered) return <Badge color="secondary">Not Answered</Badge>;
        if (isCorrect === null) return <Badge color="warning">Needs Review</Badge>;
        return isCorrect ?
            <Badge color="success">Correct</Badge> :
            <Badge color="danger">Wrong</Badge>;
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">Loading report...</p>
            </div>
        );
    }

    if (!lectureData) {
        return (
            <Alert color="danger">
                <h4 className="alert-heading">Lecture not found</h4>
                <p>The lecture you're trying to access doesn't exist or you don't have permission to view it.</p>
                <Button color="primary" onClick={() => navigate('/teacher/dashboard')}>
                    Back to Dashboard
                </Button>
            </Alert>
        );
    }

    const { lecture, attendance, publications_report } = lectureData;

    return (
        <div className="container-fluid">
            <Row className="mb-4">
                <Col>
                    <h2>Lecture Report</h2>
                    <p className="text-muted">Detailed report for lecture #{lecture.lecture_no}</p>
                </Col>
                <Col className="text-right">
                    <Button color="secondary" onClick={() => navigate('/teacher/lectures/past')}>
                        Back to Past Lectures
                    </Button>
                </Col>
            </Row>

            {/* Lecture Information */}
            <Row className="mb-4">
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle tag="h5">Lecture Information</CardTitle>
                            <Row>
                                <Col md="4">
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Course</h6>
                                        <p className="h5">{lecture.course?.code} - {lecture.course?.name}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Section</h6>
                                        <p className="h5">{lecture.section?.name}</p>
                                    </div>
                                </Col>
                                <Col md="4">
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Scheduled Date</h6>
                                        <p className="h5">{formatDateTime(lecture.scheduled_date)}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Duration</h6>
                                        <p className="h5">{formatTime(lecture.starts_at)} - {formatTime(lecture.ends_at)}</p>
                                    </div>
                                </Col>
                                <Col md="4">
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Status</h6>
                                        <Badge
                                            color={lecture.status === 'ended' ? 'success' : 'secondary'}
                                            className="h5 py-2 px-3"
                                        >
                                            {lecture.status?.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Ended At</h6>
                                        <p className="h5">{lecture.ended_at ? formatDateTime(lecture.ended_at) : 'N/A'}</p>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Tabs for Attendance and Questions */}
            <Nav tabs className="mb-4">
                <NavItem>
                    <NavLink
                        className={classnames({ active: activeTab === '1' })}
                        onClick={() => setActiveTab('1')}
                    >
                        <i className="ni ni-badge mr-1"></i>
                        Attendance ({attendance?.length || 0})
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        className={classnames({ active: activeTab === '2' })}
                        onClick={() => setActiveTab('2')}
                    >
                        <i className="ni ni-collection mr-1"></i>
                        Questions ({publications_report?.length || 0})
                    </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab={activeTab}>
                {/* Attendance Tab */}
                <TabPane tabId="1">
                    <Row>
                        <Col>
                            <Card>
                                <CardBody>
                                    <CardTitle tag="h5">Attendance Report</CardTitle>
                                    <Row className="mb-4">
                                        <Col md="3">
                                            <Card className="text-center bg-success text-white">
                                                <CardBody>
                                                    <h1 className="mb-0">
                                                        {attendance?.filter(a => a.status === 'present').length || 0}
                                                    </h1>
                                                    <p className="mb-0">Present</p>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3">
                                            <Card className="text-center bg-danger text-white">
                                                <CardBody>
                                                    <h1 className="mb-0">
                                                        {attendance?.filter(a => a.status === 'absent').length || 0}
                                                    </h1>
                                                    <p className="mb-0">Absent</p>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3">
                                            <Card className="text-center bg-warning text-white">
                                                <CardBody>
                                                    <h1 className="mb-0">
                                                        {attendance?.filter(a => a.status === 'late').length || 0}
                                                    </h1>
                                                    <p className="mb-0">Late</p>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3">
                                            <Card className="text-center bg-info text-white">
                                                <CardBody>
                                                    <h1 className="mb-0">
                                                        {attendance?.filter(a => a.status === 'left').length || 0}
                                                    </h1>
                                                    <p className="mb-0">Left</p>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {attendance && attendance.length > 0 ? (
                                        <Table responsive hover>
                                            <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Email</th>
                                                <th>Status</th>
                                                <th>Checked In</th>
                                                <th>Last Seen</th>
                                                <th>Minutes Attended</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {attendance.map((record, index) => (
                                                <tr key={index}>
                                                    <td>{record.student.full_name}</td>
                                                    <td>{record.student.email}</td>
                                                    <td>{getAttendanceStatusBadge(record.status)}</td>
                                                    <td>{formatDateTime(record.checked_in_at)}</td>
                                                    <td>{formatDateTime(record.last_seen_at)}</td>
                                                    <td>
                                                        <Badge color="primary">
                                                            {record.minutes_attended} min
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <Alert color="info">
                                            No attendance records available.
                                        </Alert>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </TabPane>

                {/* Questions Tab */}
                <TabPane tabId="2">
                    <Row>
                        <Col>
                            {publications_report && publications_report.length > 0 ? (
                                publications_report.map((publication, pubIndex) => (
                                    <Card key={pubIndex} className="mb-4">
                                        <CardBody>
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h5>Q{pubIndex + 1}: {publication.question.question_text}</h5>
                                                    <div className="d-flex align-items-center mt-2">
                                                        <Badge color="info" className="mr-2">
                                                            {publication.question.type === 'mcq' ? 'Multiple Choice' :
                                                                publication.question.type === 'true_false' ? 'True/False' :
                                                                    'Short Answer'}
                                                        </Badge>
                                                        <Badge color="success" className="mr-2">
                                                            {publication.question.points} point(s)
                                                        </Badge>
                                                        <Badge color="secondary" className="mr-2">
                                                            Published: {formatTime(publication.publication.published_at)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <h6>Statistics</h6>
                                                    <div className="d-flex">
                                                        <Badge color="success" className="mr-2">
                                                            Answered: {publication.stats.answered}/{publication.stats.total_students}
                                                        </Badge>
                                                        <Badge color="primary" className="mr-2">
                                                            Correct: {publication.stats.correct}
                                                        </Badge>
                                                        <Badge color="warning">
                                                            Avg Score: {publication.stats.avg_score.toFixed(1)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Options for MCQ and True/False */}
                                            {['mcq', 'true_false'].includes(publication.question.type) && (
                                                <div className="mb-4">
                                                    <h6>Options:</h6>
                                                    <Row>
                                                        {publication.question.options.map((option, optIndex) => (
                                                            <Col md="6" key={optIndex}>
                                                                <div className={`p-2 mb-2 rounded ${option.is_correct ? 'bg-success text-white' : 'bg-light'}`}>
                                                                    {option.text} {option.is_correct && '✓'}
                                                                </div>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </div>
                                            )}

                                            {/* Student Responses */}
                                            <h6>Student Responses:</h6>
                                            <Table responsive hover>
                                                <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Status</th>
                                                    <th>Answer</th>
                                                    <th>Score</th>
                                                    <th>Answered At</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {publication.students.map((studentRecord, studIndex) => (
                                                    <tr key={studIndex}>
                                                        <td>{studentRecord.student.full_name}</td>
                                                        <td>{getAnswerStatusBadge(studentRecord.is_correct, studentRecord.answered)}</td>
                                                        <td>
                                                            {studentRecord.answered ? (
                                                                <div>
                                                                    {studentRecord.selected_option ? (
                                                                        <span>{studentRecord.selected_option.text}</span>
                                                                    ) : studentRecord.answer_text ? (
                                                                        <span className="font-italic">"{studentRecord.answer_text}"</span>
                                                                    ) : (
                                                                        <span className="text-muted">No answer</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted">No response</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <Badge color={studentRecord.score > 0 ? "success" : "secondary"}>
                                                                {studentRecord.score} point(s)
                                                            </Badge>
                                                        </td>
                                                        <td>{formatDateTime(studentRecord.answered_at)}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </CardBody>
                                    </Card>
                                ))
                            ) : (
                                <Alert color="info">
                                    No questions were published during this lecture.
                                </Alert>
                            )}
                        </Col>
                    </Row>
                </TabPane>
            </TabContent>

            {/* Summary Statistics */}
            <Row className="mt-4">
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle tag="h5">Overall Summary</CardTitle>
                            <Row>
                                <Col md="3">
                                    <Card className="text-center">
                                        <CardBody>
                                            <h1 className="text-primary mb-0">
                                                {publications_report?.length || 0}
                                            </h1>
                                            <p className="text-muted mb-0">Questions Published</p>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card className="text-center">
                                        <CardBody>
                                            <h1 className="text-success mb-0">
                                                {publications_report?.reduce((sum, pub) => sum + pub.stats.answered, 0) || 0}
                                            </h1>
                                            <p className="text-muted mb-0">Total Answers</p>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card className="text-center">
                                        <CardBody>
                                            <h1 className="text-info mb-0">
                                                {publications_report?.reduce((sum, pub) => sum + pub.stats.correct, 0) || 0}
                                            </h1>
                                            <p className="text-muted mb-0">Correct Answers</p>
                                        </CardBody>
                                    </Card>
                                </Col>
                                <Col md="3">
                                    <Card className="text-center">
                                        <CardBody>
                                            <h1 className="text-warning mb-0">
                                                {publications_report?.length ?
                                                    (publications_report.reduce((sum, pub) => sum + pub.stats.avg_score, 0) / publications_report.length).toFixed(1) : 0
                                                }
                                            </h1>
                                            <p className="text-muted mb-0">Avg Score per Question</p>
                                        </CardBody>
                                    </Card>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LectureReport;