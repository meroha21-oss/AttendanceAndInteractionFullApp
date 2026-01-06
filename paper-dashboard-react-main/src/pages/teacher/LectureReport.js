import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    CardTitle,
    CardText,
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

const LectureReport = () => {
    const { lectureId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [lecture, setLecture] = useState(null);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();

    useEffect(() => {
        if (!lectureId || isNaN(lectureId)) {
            enqueueSnackbar('Invalid lecture ID', { variant: 'error' });
            navigate('/teacher/dashboard');
            return;
        }

        fetchReportData();
    }, [lectureId, navigate, enqueueSnackbar]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchLectureDetails(),
                fetchInteractionReport()
            ]);
        } catch (error) {
            enqueueSnackbar('Failed to load report data', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const fetchLectureDetails = async () => {
        try {
            const response = await callApi(() => lectureService.getById(lectureId));
            setLecture(response.data);
        } catch (error) {
            console.error('Error fetching lecture:', error);
        }
    };

    const fetchInteractionReport = async () => {
        try {
            const response = await callApi(() => lectureService.getInteractionReport(lectureId));
            setReport(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        }
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (error) {
            return 'Invalid time';
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner color="primary" />
                <p className="mt-2">Loading report...</p>
            </div>
        );
    }

    if (!lecture) {
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

    return (
        <div className="container-fluid">
            <Row className="mb-4">
                <Col>
                    <h2>Lecture Report</h2>
                    <p className="text-muted">Detailed report for the lecture.</p>
                </Col>
                <Col className="text-right">
                    <Button color="secondary" onClick={() => navigate(-1)}>
                        Back
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
                                <Col md="6">
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Course</h6>
                                        <p className="h5">{lecture.course?.code || 'N/A'} - {lecture.course?.name || 'Unknown'}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Section</h6>
                                        <p className="h5">{lecture.section?.name || 'N/A'}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Lecture Number</h6>
                                        <p className="h5">#{lecture.lecture_no || 'N/A'}</p>
                                    </div>
                                </Col>
                                <Col md="6">
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Start Time</h6>
                                        <p className="h5">{formatTime(lecture.starts_at)}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">End Time</h6>
                                        <p className="h5">{lecture.ended_at ? formatTime(lecture.ended_at) : 'N/A'}</p>
                                    </div>
                                    <div className="mb-3">
                                        <h6 className="text-muted mb-1">Status</h6>
                                        <Badge
                                            color={lecture.status === 'ended' ? 'success' : 'secondary'}
                                            className="h5 py-2 px-3"
                                        >
                                            {lecture.status?.toUpperCase() || 'UNKNOWN'}
                                        </Badge>
                                    </div>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Interaction Report */}
            {report && (
                <Row className="mb-4">
                    <Col>
                        <Card>
                            <CardBody>
                                <CardTitle tag="h5">Interaction Report</CardTitle>

                                {/* Summary */}
                                <Row className="mb-4">
                                    <Col md="4">
                                        <Card className="text-center">
                                            <CardBody>
                                                <h1 className="text-primary">{report.summary?.publications_count || 0}</h1>
                                                <p className="text-muted mb-0">Questions Published</p>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col md="4">
                                        <Card className="text-center">
                                            <CardBody>
                                                <h1 className="text-success">{report.summary?.answers_count || 0}</h1>
                                                <p className="text-muted mb-0">Total Answers</p>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col md="4">
                                        <Card className="text-center">
                                            <CardBody>
                                                <h1 className="text-warning">{report.summary?.total_score_awarded || 0}</h1>
                                                <p className="text-muted mb-0">Total Score Awarded</p>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* Student Performance */}
                                {report.by_student && report.by_student.length > 0 ? (
                                    <>
                                        <h6>Student Performance</h6>
                                        <Table responsive hover>
                                            <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Questions Attempted</th>
                                                <th>Correct Answers</th>
                                                <th>Total Score</th>
                                                <th>Performance</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {report.by_student.map((student, index) => (
                                                <tr key={index}>
                                                    <td>{student.student_name}</td>
                                                    <td>{student.questions_attempted}</td>
                                                    <td>{student.correct_answers}</td>
                                                    <td>
                                                        <Badge color="success">
                                                            {student.total_score} points
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {student.performance === 'Excellent' && (
                                                            <Badge color="success">Excellent</Badge>
                                                        )}
                                                        {student.performance === 'Good' && (
                                                            <Badge color="info">Good</Badge>
                                                        )}
                                                        {student.performance === 'Average' && (
                                                            <Badge color="warning">Average</Badge>
                                                        )}
                                                        {student.performance === 'Poor' && (
                                                            <Badge color="danger">Poor</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    </>
                                ) : (
                                    <Alert color="info">
                                        <i className="ni ni-bulb-61 mr-2"></i>
                                        No student interaction data available for this lecture.
                                    </Alert>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Attendance Summary */}
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle tag="h5">Attendance Summary</CardTitle>
                            <Alert color="info">
                                <i className="ni ni-info mr-2"></i>
                                Attendance data will be available after the lecture ends. Check back later for detailed attendance reports.
                            </Alert>
                            <Button color="primary" onClick={() => navigate(`/teacher/lectures/${lectureId}/attendance`)}>
                                View Attendance Details
                            </Button>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LectureReport;