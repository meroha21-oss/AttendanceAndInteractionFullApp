import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    CardBody,
    Table,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    FormGroup,
    Label,
    Input,
    Badge,
    Alert,
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { assignmentService } from '../../services/assignmentService';
import { courseService } from '../../services/courseService';
import { sectionService } from '../../services/sectionService';
import { userService } from '../../services/userService';
import { useApi } from '../../hooks/useApi';

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [formData, setFormData] = useState({
        section_id: '',
        course_id: '',
        instructor_id: '',
        first_starts_at: '',
        duration_minutes: 120,
        total_lectures: 12,
    });
    const { enqueueSnackbar } = useSnackbar();
    const { loading, callApi } = useApi();

    useEffect(() => {
        fetchAssignments();
        fetchCourses();
        fetchSections();
        fetchTeachers();
    }, []);

    const fetchAssignments = async () => {
        try {
            const response = await callApi(() => assignmentService.getAll());
            setAssignments(response.data);
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await callApi(() => courseService.getAll());
            setCourses(response.data);
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const fetchSections = async () => {
        try {
            const response = await callApi(() => sectionService.getAll());
            setSections(response.data);
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await callApi(() => userService.getTeachers());
            setTeachers(response.data);
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await callApi(() =>
                    assignmentService.create(formData),
                'Course assigned successfully with auto-generated lectures'
            );
            setModalOpen(false);
            resetForm();
            fetchAssignments();
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const resetForm = () => {
        setFormData({
            section_id: '',
            course_id: '',
            instructor_id: '',
            first_starts_at: '',
            duration_minutes: 120,
            total_lectures: 12,
        });
    };

    const handleView = async (id) => {
        try {
            const response = await callApi(() => assignmentService.getById(id));
            setSelectedAssignment(response.data);
            setViewModalOpen(true);
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this assignment?')) {
            try {
                await callApi(() => assignmentService.delete(id), 'Assignment deleted successfully');
                fetchAssignments();
            } catch (error) {
                // Error is handled by useApi
            }
        }
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <>
            <Row className="mb-4">
                <Col>
                    <h2>Course Assignments</h2>
                    <p className="text-muted">Assign courses to sections with auto-generated lecture schedules</p>
                </Col>
                <Col className="text-right">
                    <Button color="primary" onClick={() => setModalOpen(true)}>
                        <i className="ni ni-fat-add"></i> New Assignment
                    </Button>
                </Col>
            </Row>

            <Card>
                <CardBody>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Course</th>
                            <th>Section</th>
                            <th>Instructor</th>
                            <th>Lectures</th>
                            <th>Starts At</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {assignments.map((assignment) => (
                            <tr key={assignment.id}>
                                <td>
                                    <strong>{assignment.course?.code}</strong>
                                    <div className="small">{assignment.course?.name}</div>
                                </td>
                                <td>{assignment.section?.name}</td>
                                <td>{assignment.instructor?.full_name}</td>
                                <td>
                                    <Badge color="info">{assignment.total_lectures}</Badge>
                                </td>
                                <td>{formatDateTime(assignment.first_starts_at)}</td>
                                <td>
                                    <Badge color={assignment.is_active ? 'success' : 'danger'}>
                                        {assignment.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td>
                                    <Button
                                        color="info"
                                        size="sm"
                                        className="mr-2"
                                        onClick={() => handleView(assignment.id)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        color="danger"
                                        size="sm"
                                        onClick={() => handleDelete(assignment.id)}
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            {/* Create Assignment Modal */}
            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                    Create Course Assignment
                </ModalHeader>
                <Form onSubmit={handleSubmit}>
                    <ModalBody>
                        <Alert color="info">
                            This will create an assignment and automatically generate lecture schedules based on the first lecture date and total lectures.
                        </Alert>

                        <Row>
                            <Col md="6">
                                <FormGroup>
                                    <Label for="section_id">Section *</Label>
                                    <Input
                                        type="select"
                                        name="section_id"
                                        id="section_id"
                                        value={formData.section_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map((section) => (
                                            <option key={section.id} value={section.id}>
                                                {section.name} - {section.semester} {section.year}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label for="course_id">Course *</Label>
                                    <Input
                                        type="select"
                                        name="course_id"
                                        id="course_id"
                                        value={formData.course_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Course</option>
                                        {courses.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                {course.code} - {course.name}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>

                        <Row>
                            <Col md="6">
                                <FormGroup>
                                    <Label for="instructor_id">Instructor *</Label>
                                    <Input
                                        type="select"
                                        name="instructor_id"
                                        id="instructor_id"
                                        value={formData.instructor_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Instructor</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher.id} value={teacher.id}>
                                                {teacher.full_name} - {teacher.email}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label for="first_starts_at">First Lecture Date & Time *</Label>
                                    <Input
                                        type="datetime-local"
                                        name="first_starts_at"
                                        id="first_starts_at"
                                        value={formData.first_starts_at}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </FormGroup>
                            </Col>
                        </Row>

                        <Row>
                            <Col md="6">
                                <FormGroup>
                                    <Label for="duration_minutes">Duration (minutes) *</Label>
                                    <Input
                                        type="number"
                                        name="duration_minutes"
                                        id="duration_minutes"
                                        value={formData.duration_minutes}
                                        onChange={handleInputChange}
                                        min="30"
                                        max="300"
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md="6">
                                <FormGroup>
                                    <Label for="total_lectures">Total Lectures *</Label>
                                    <Input
                                        type="number"
                                        name="total_lectures"
                                        id="total_lectures"
                                        value={formData.total_lectures}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="52"
                                        required
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="submit" color="primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Assignment'}
                        </Button>
                        <Button color="secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Assignment Modal */}
            <Modal isOpen={viewModalOpen} toggle={() => setViewModalOpen(!viewModalOpen)} size="xl">
                <ModalHeader toggle={() => setViewModalOpen(!viewModalOpen)}>
                    Assignment Details
                </ModalHeader>
                <ModalBody>
                    {selectedAssignment && (
                        <>
                            <Row className="mb-4">
                                <Col md="4">
                                    <h5>Course</h5>
                                    <p>
                                        <strong>{selectedAssignment.course?.code}</strong><br />
                                        {selectedAssignment.course?.name}
                                    </p>
                                </Col>
                                <Col md="4">
                                    <h5>Section</h5>
                                    <p>{selectedAssignment.section?.name}</p>
                                </Col>
                                <Col md="4">
                                    <h5>Instructor</h5>
                                    <p>{selectedAssignment.instructor?.full_name}</p>
                                </Col>
                            </Row>

                            <Row className="mb-4">
                                <Col md="4">
                                    <h5>First Lecture</h5>
                                    <p>{formatDateTime(selectedAssignment.first_starts_at)}</p>
                                </Col>
                                <Col md="4">
                                    <h5>Duration</h5>
                                    <p>{selectedAssignment.duration_minutes} minutes</p>
                                </Col>
                                <Col md="4">
                                    <h5>Total Lectures</h5>
                                    <p>{selectedAssignment.total_lectures}</p>
                                </Col>
                            </Row>

                            <h5 className="mt-4">Generated Lectures</h5>
                            {selectedAssignment.lectures && selectedAssignment.lectures.length > 0 ? (
                                <Table responsive size="sm">
                                    <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Scheduled Date</th>
                                        <th>Starts At</th>
                                        <th>Ends At</th>
                                        <th>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selectedAssignment.lectures.map((lecture) => (
                                        <tr key={lecture.id}>
                                            <td>Lecture {lecture.lecture_no}</td>
                                            <td>{new Date(lecture.scheduled_date).toLocaleDateString()}</td>
                                            <td>{formatDateTime(lecture.starts_at)}</td>
                                            <td>{formatDateTime(lecture.ends_at)}</td>
                                            <td>
                                                <Badge color={
                                                    lecture.status === 'scheduled' ? 'info' :
                                                        lecture.status === 'running' ? 'warning' :
                                                            lecture.status === 'ended' ? 'success' : 'danger'
                                                }>
                                                    {lecture.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <Alert color="warning">No lectures generated yet.</Alert>
                            )}
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setViewModalOpen(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default Assignments;