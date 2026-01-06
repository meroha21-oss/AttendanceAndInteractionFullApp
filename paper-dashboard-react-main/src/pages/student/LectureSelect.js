import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Button,
    Table,
    Badge,
    Spinner,
    Alert,
    FormGroup,
    Label,
    Input
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { lectureService } from '../../services/lectureService';
import { useApi } from '../../hooks/useApi';

const LectureSelect = () => {
    const navigate = useNavigate();
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLectureId, setSelectedLectureId] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const { callApi } = useApi();

    useEffect(() => {
        fetchTodayLectures();
    }, []);

    const fetchTodayLectures = async () => {
        try {
            setLoading(true);
            const response = await callApi(() => lectureService.getTodayLectures());
            setLectures(response.data || []);
        } catch (error) {
            enqueueSnackbar('Failed to load lectures', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLecture = () => {
        if (!selectedLectureId) {
            enqueueSnackbar('Please select a lecture to join', { variant: 'warning' });
            return;
        }

        // Navigate to the attendance page with the selected lecture ID
        navigate(`/student/lecture/attend/${selectedLectureId}`);
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
        <Container className="mt-5">
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle tag="h4" className="mb-4">
                                <i className="ni ni-calendar-grid-58 mr-2"></i>
                                Select Lecture to Attend
                            </CardTitle>

                            {lectures.length === 0 ? (
                                <Alert color="info">
                                    <i className="ni ni-bell-55 mr-2"></i>
                                    No lectures scheduled for today. Please check back later or view the weekly schedule.
                                </Alert>
                            ) : (
                                <>
                                    <FormGroup>
                                        <Label for="lectureSelect">Select Lecture</Label>
                                        <Input
                                            type="select"
                                            id="lectureSelect"
                                            value={selectedLectureId}
                                            onChange={(e) => setSelectedLectureId(e.target.value)}
                                        >
                                            <option value="">Select a lecture...</option>
                                            {lectures.map((lecture) => (
                                                <option key={lecture.id} value={lecture.id}>
                                                    {lecture.course?.code} - {lecture.course?.name} |
                                                    Section: {lecture.section?.name} |
                                                    Time: {new Date(lecture.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {new Date(lecture.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>

                                    <Button
                                        color="primary"
                                        onClick={handleJoinLecture}
                                        disabled={!selectedLectureId}
                                        className="mt-3"
                                    >
                                        <i className="ni ni-user-run mr-2"></i>
                                        Join Selected Lecture
                                    </Button>

                                    <hr className="my-4" />

                                    <h5 className="mb-3">Today's Lectures</h5>
                                    <Table responsive>
                                        <thead>
                                        <tr>
                                            <th>Course</th>
                                            <th>Section</th>
                                            <th>Time</th>
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
                                                    {new Date(lecture.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {' - '}
                                                    {new Date(lecture.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td>
                                                    <Badge
                                                        color={
                                                            lecture.status === 'running' ? 'success' :
                                                                lecture.status === 'scheduled' ? 'warning' :
                                                                    lecture.status === 'completed' ? 'secondary' : 'info'
                                                        }
                                                    >
                                                        {lecture.status?.toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Button
                                                        color="primary"
                                                        size="sm"
                                                        onClick={() => navigate(`/student/lecture/attend/${lecture.id}`)}
                                                        disabled={lecture.status !== 'running'}
                                                        title={lecture.status !== 'running' ? 'Only running lectures can be joined' : ''}
                                                    >
                                                        {lecture.status === 'running' ? (
                                                            <>
                                                                <i className="ni ni-user-run mr-1"></i>
                                                                Join
                                                            </>
                                                        ) : (
                                                            'View'
                                                        )}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>
                                </>
                            )}
                        </CardBody>
                    </Card>

                    <Card className="mt-4">
                        <CardBody>
                            <CardTitle tag="h5">
                                <i className="ni ni-bulb-61 mr-2"></i>
                                Instructions
                            </CardTitle>
                            <ul>
                                <li>Select a lecture from the dropdown or table above</li>
                                <li>Click "Join Selected Lecture" to start attending</li>
                                <li>Only lectures marked as "RUNNING" can be joined</li>
                                <li>You must stay active during the lecture to maintain attendance</li>
                                <li>Attendance is tracked automatically through heartbeats</li>
                            </ul>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default LectureSelect;