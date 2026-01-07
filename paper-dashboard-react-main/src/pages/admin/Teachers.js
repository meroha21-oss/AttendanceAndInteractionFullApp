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
    InputGroupText,
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { userService } from '../../services/userService';
import { useApi } from '../../hooks/useApi';
import AddUserModal from './AddUserModal'; // Import the new modal

const Teachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false); // State for add modal
    const [editingTeacher, setEditingTeacher] = useState(null);
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
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await callApi(() => userService.getTeachers());
            setTeachers(response.data);
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
                    userService.updateUser(editingTeacher.id, formData),
                'Teacher updated successfully'
            );
            setModalOpen(false);
            resetForm();
            fetchTeachers();
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const handleAddTeacher = async (formData) => {
        try {
            await callApi(() =>
                    userService.register(formData),
                'Teacher added successfully'
            );
            setAddModalOpen(false);
            fetchTeachers();
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
        setEditingTeacher(null);
    };

    const handleEdit = (teacher) => {
        setEditingTeacher(teacher);
        setFormData({
            full_name: teacher.full_name,
            email: teacher.email,
            phone: teacher.phone,
            is_active: teacher.is_active,
        });
        setModalOpen(true);
    };

    const handleToggleActive = async (id) => {
        try {
            await callApi(() => userService.toggleActive(id), 'Status updated successfully');
            fetchTeachers();
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const filteredTeachers = teachers.filter(teacher =>
        teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.phone.includes(searchTerm)
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <>
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2>Teachers</h2>
                </Col>
                <Col md="4">
                    <InputGroup>
                        <InputGroupText>
                            <i className="ni ni-zoom-split-in"></i>
                        </InputGroupText>
                        <Input
                            type="text"
                            placeholder="Search teachers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Col>
                <Col md="auto">
                    <Button
                        color="primary"
                        onClick={() => setAddModalOpen(true)}
                    >
                        <i className="ni ni-fat-add mr-1"></i> Add Teacher
                    </Button>
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
                        {filteredTeachers.map((teacher) => (
                            <tr key={teacher.id}>
                                <td>
                                    <div className="d-flex align-items-center">
                                        <img
                                            src={teacher.profile_photo || '/default-avatar.png'}
                                            alt={teacher.full_name}
                                            className="rounded-circle mr-2"
                                            style={{ width: '36px', height: '36px' }}
                                        />
                                        <div>
                                            <strong>{teacher.full_name}</strong>
                                            <div className="small text-muted">ID: {teacher.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{teacher.email}</td>
                                <td>{teacher.phone}</td>
                                <td>
                                    <Badge
                                        color={teacher.is_active ? 'success' : 'danger'}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleToggleActive(teacher.id)}
                                    >
                                        {teacher.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td>{formatDate(teacher.created_at)}</td>
                                <td>
                                    <Button
                                        color="info"
                                        size="sm"
                                        className="mr-2"
                                        onClick={() => handleEdit(teacher)}
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

            {/* Edit Modal */}
            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                    Edit Teacher
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

            {/* Add Teacher Modal */}
            <AddUserModal
                isOpen={addModalOpen}
                toggle={() => setAddModalOpen(!addModalOpen)}
                role="teacher"
                onSubmit={handleAddTeacher}
                loading={loading}
            />
        </>
    );
};

export default Teachers;