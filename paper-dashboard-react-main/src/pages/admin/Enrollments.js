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
import { enrollmentService } from '../../services/enrollmentService';
import { sectionService } from '../../services/sectionService';
import { userService } from '../../services/userService';
import { useApi } from '../../hooks/useApi';

const Enrollments = () => {
    const [enrollments, setEnrollments] = useState([]);
    const [sections, setSections] = useState([]);
    const [students, setStudents] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        section_id: '',
        student_id: '',
    });
    const [bulkFormData, setBulkFormData] = useState({
        section_id: '',
        student_ids: [],
    });
    const { enqueueSnackbar } = useSnackbar();
    const { loading, callApi } = useApi();

    useEffect(() => {
        fetchEnrollments();
        fetchSections();
        fetchStudents();
    }, []);

    const fetchEnrollments = async () => {
        try {
            const response = await callApi(() => enrollmentService.getAll());
            setEnrollments(response.data);
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

    const fetchStudents = async () => {
        try {
            const response = await callApi(() => userService.getStudents());
            setStudents(response.data);
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

    const handleBulkInputChange = (e) => {
        const { name, value, options } = e.target;
        if (name === 'student_ids') {
            const selectedStudents = Array.from(options)
                .filter(option => option.selected)
                .map(option => option.value);
            setBulkFormData({
                ...bulkFormData,
                student_ids: selectedStudents,
            });
        } else {
            setBulkFormData({
                ...bulkFormData,
                [name]: value,
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await callApi(() =>
                    enrollmentService.create(formData),
                'Student enrolled successfully'
            );
            setModalOpen(false);
            resetForm();
            fetchEnrollments();
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        try {
            await callApi(() =>
                    enrollmentService.bulkCreate(bulkFormData),
                'Students enrolled successfully'
            );
            setBulkModalOpen(false);
            setBulkFormData({
                section_id: '',
                student_ids: [],
            });
            fetchEnrollments();
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const resetForm = () => {
        setFormData({
            section_id: '',
            student_id: '',
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this enrollment?')) {
            try {
                await callApi(() => enrollmentService.delete(id), 'Enrollment removed successfully');
                fetchEnrollments();
            } catch (error) {
                // Error is handled by useApi
            }
        }
    };

    return (
        <>
            <Row className="mb-4">
                <Col>
                    <h2>Enrollments</h2>
                </Col>
                <Col className="text-right">
                    <Button color="primary" onClick={() => setModalOpen(true)} className="mr-2">
                        <i className="ni ni-fat-add"></i> Add Enrollment
                    </Button>
                    <Button color="success" onClick={() => setBulkModalOpen(true)}>
                        <i className="ni ni-fat-add"></i> Bulk Enrollment
                    </Button>
                </Col>
            </Row>

            <Card>
                <CardBody>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Student</th>
                            <th>Section</th>
                            <th>Enrolled At</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {enrollments.map((enrollment) => (
                            <tr key={enrollment.id}>
                                <td>{enrollment.student?.full_name}</td>
                                <td>{enrollment.section?.name}</td>
                                <td>{new Date(enrollment.created_at).toLocaleDateString()}</td>
                                <td>
                                    <Button
                                        color="danger"
                                        size="sm"
                                        onClick={() => handleDelete(enrollment.id)}
                                    >
                                        Remove
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            {/* Single Enrollment Modal */}
            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                    Add Enrollment
                </ModalHeader>
                <Form onSubmit={handleSubmit}>
                    <ModalBody>
                        <FormGroup>
                            <Label for="section_id">Section</Label>
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
                        <FormGroup>
                            <Label for="student_id">Student</Label>
                            <Input
                                type="select"
                                name="student_id"
                                id="student_id"
                                value={formData.student_id}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select Student</option>
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.full_name} - {student.email}
                                    </option>
                                ))}
                            </Input>
                        </FormGroup>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="submit" color="primary" disabled={loading}>
                            {loading ? 'Enrolling...' : 'Enroll'}
                        </Button>
                        <Button color="secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Bulk Enrollment Modal */}
            <Modal isOpen={bulkModalOpen} toggle={() => setBulkModalOpen(!bulkModalOpen)} size="lg">
                <ModalHeader toggle={() => setBulkModalOpen(!bulkModalOpen)}>
                    Bulk Enrollment
                </ModalHeader>
                <Form onSubmit={handleBulkSubmit}>
                    <ModalBody>
                        <Alert color="info">
                            Select a section and multiple students to enroll them all at once.
                        </Alert>
                        <FormGroup>
                            <Label for="section_id">Section</Label>
                            <Input
                                type="select"
                                name="section_id"
                                id="section_id"
                                value={bulkFormData.section_id}
                                onChange={handleBulkInputChange}
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
                        <FormGroup>
                            <Label for="student_ids">Students (Select Multiple)</Label>
                            <Input
                                type="select"
                                name="student_ids"
                                id="student_ids"
                                multiple
                                value={bulkFormData.student_ids}
                                onChange={handleBulkInputChange}
                                required
                                style={{ height: '200px' }}
                            >
                                {students.map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.full_name} - {student.email}
                                    </option>
                                ))}
                            </Input>
                            <small className="form-text text-muted">
                                Hold Ctrl (or Cmd on Mac) to select multiple students
                            </small>
                        </FormGroup>
                        <div className="mt-2">
                            <Badge color="info">
                                Selected: {bulkFormData.student_ids.length} students
                            </Badge>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="submit" color="primary" disabled={loading}>
                            {loading ? 'Enrolling...' : 'Enroll Selected'}
                        </Button>
                        <Button color="secondary" onClick={() => setBulkModalOpen(false)}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>
        </>
    );
};

export default Enrollments;