import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
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
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { courseService } from '../../services/courseService';
import { useApi } from '../../hooks/useApi';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        is_active: true,
    });
    const { enqueueSnackbar } = useSnackbar();
    const { loading, callApi } = useApi();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await callApi(() => courseService.getAll());
            setCourses(response.data);
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCourse) {
                await callApi(() =>
                        courseService.update(editingCourse.id, formData),
                    'Course updated successfully'
                );
            } else {
                await callApi(() =>
                        courseService.create(formData),
                    'Course created successfully'
                );
            }
            setModalOpen(false);
            resetForm();
            fetchCourses();
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            is_active: true,
        });
        setEditingCourse(null);
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setFormData({
            code: course.code,
            name: course.name,
            is_active: course.is_active,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                await callApi(() => courseService.delete(id), 'Course deleted successfully');
                fetchCourses();
            } catch (error) {
                // Error is handled by useApi
            }
        }
    };

    return (
        <>
            <Row className="mb-4">
                <Col>
                    <h2>Courses</h2>
                </Col>
                <Col className="text-right">
                    <Button color="primary" onClick={() => setModalOpen(true)}>
                        <i className="ni ni-fat-add"></i> Add Course
                    </Button>
                </Col>
            </Row>

            <Card>
                <CardBody>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {courses.map((course) => (
                            <tr key={course.id}>
                                <td>{course.code}</td>
                                <td>{course.name}</td>
                                <td>
                                    <Badge color={course.is_active ? 'success' : 'danger'}>
                                        {course.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td>{new Date(course.created_at).toLocaleDateString()}</td>
                                <td>
                                    <Button
                                        color="info"
                                        size="sm"
                                        className="mr-2"
                                        onClick={() => handleEdit(course)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        color="danger"
                                        size="sm"
                                        onClick={() => handleDelete(course.id)}
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

            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                </ModalHeader>
                <Form onSubmit={handleSubmit}>
                    <ModalBody>
                        <FormGroup>
                            <Label for="code">Course Code</Label>
                            <Input
                                type="text"
                                name="code"
                                id="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                required
                                disabled={!!editingCourse}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="name">Course Name</Label>
                            <Input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </FormGroup>
                        <FormGroup check>
                            <Label check>
                                <Input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                />{' '}
                                Active
                            </Label>
                        </FormGroup>
                    </ModalBody>
                    <ModalFooter>
                        <Button type="submit" color="primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button color="secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>
        </>
    );
};

export default Courses;