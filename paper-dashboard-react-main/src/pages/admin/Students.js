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
    InputGroup,
    InputGroupText
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/userService';
import { useApi } from '../../hooks/useApi';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        is_active: true,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const { loading, callApi } = useApi();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await callApi(() => userService.getStudents());
            setStudents(response.data);
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
            await callApi(() =>
                    userService.updateUser(editingStudent.id, formData),
                'Student updated successfully'
            );
            setModalOpen(false);
            resetForm();
            fetchStudents();
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            is_active: true,
        });
        setEditingStudent(null);
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({
            full_name: student.full_name,
            email: student.email,
            phone: student.phone,
            is_active: student.is_active,
        });
        setModalOpen(true);
    };

    const handleToggleActive = async (id) => {
        try {
            await callApi(() => userService.toggleActive(id), 'Status updated successfully');
            fetchStudents();
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const filteredStudents = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone.includes(searchTerm)
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <>
            <Row className="mb-4">
                <Col>
                    <h2>Students</h2>
                </Col>
                <Col md="4">
                    <InputGroup>
                        <InputGroupText> {/* Remove the InputGroupAddon wrapper */}
                            <i className="ni ni-zoom-split-in"></i>
                        </InputGroupText>
                        <Input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Col>
            </Row>

            <Card>
                <CardBody>
                    <Table responsive hover>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredStudents.map((student) => (
                            <tr key={student.id}>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={student.profile_photo || '/default-avatar.png'}
                                            alt={student.full_name}
                                            className="rounded-circle mr-2"
                                            style={{ width: '36px', height: '36px' }}
                                        />
                                        <div>
                                            <strong>{student.full_name}</strong>
                                            <div className="small text-muted">ID: {student.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{student.email}</td>
                                <td>{student.phone}</td>
                                <td>
                                    <Badge
                                        color={student.is_active ? 'success' : 'danger'}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleToggleActive(student.id)}
                                    >
                                        {student.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td>{formatDate(student.created_at)}</td>
                                <td>
                                    <Button
                                        color="info"
                                        size="sm"
                                        className="mr-2"
                                        onClick={() => handleEdit(student)}
                                    >
                                        Edit
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
                    Edit Student
                </ModalHeader>
                <Form onSubmit={handleSubmit}>
                    <ModalBody>
                        <FormGroup>
                            <Label for="full_name">Full Name</Label>
                            <Input
                                type="text"
                                name="full_name"
                                id="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="email">Email</Label>
                            <Input
                                type="email"
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="phone">Phone</Label>
                            <Input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
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
                            {loading ? 'Updating...' : 'Update'}
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

export default Students;