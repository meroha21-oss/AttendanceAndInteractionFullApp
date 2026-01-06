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
} from 'reactstrap';
import { useSnackbar } from 'notistack';
import { sectionService } from '../../services/sectionService';
import { useApi } from '../../hooks/useApi';

const Sections = () => {
    const [sections, setSections] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        semester: 'Fall',
        year: new Date().getFullYear(),
        is_active: true,
    });
    const { enqueueSnackbar } = useSnackbar();
    const { loading, callApi } = useApi();

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const response = await callApi(() => sectionService.getAll());
            setSections(response.data);
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
            if (editingSection) {
                await callApi(() =>
                        sectionService.update(editingSection.id, formData),
                    'Section updated successfully'
                );
            } else {
                await callApi(() =>
                        sectionService.create(formData),
                    'Section created successfully'
                );
            }
            setModalOpen(false);
            resetForm();
            fetchSections();
        } catch (error) {
            // Error is handled by useApi
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            semester: 'Fall',
            year: new Date().getFullYear(),
            is_active: true,
        });
        setEditingSection(null);
    };

    const handleEdit = (section) => {
        setEditingSection(section);
        setFormData({
            name: section.name,
            semester: section.semester,
            year: section.year,
            is_active: section.is_active,
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this section?')) {
            try {
                await callApi(() => sectionService.delete(id), 'Section deleted successfully');
                fetchSections();
            } catch (error) {
                // Error is handled by useApi
            }
        }
    };

    return (
        <>
            <Row className="mb-4">
                <Col>
                    <h2>Sections</h2>
                </Col>
                <Col className="text-right">
                    <Button color="primary" onClick={() => setModalOpen(true)}>
                        <i className="ni ni-fat-add"></i> Add Section
                    </Button>
                </Col>
            </Row>

            <Card>
                <CardBody>
                    <Table responsive>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Semester</th>
                            <th>Year</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sections.map((section) => (
                            <tr key={section.id}>
                                <td>{section.name}</td>
                                <td>{section.semester}</td>
                                <td>{section.year}</td>
                                <td>
                                    <Badge color={section.is_active ? 'success' : 'danger'}>
                                        {section.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td>{new Date(section.created_at).toLocaleDateString()}</td>
                                <td>
                                    <Button
                                        color="info"
                                        size="sm"
                                        className="mr-2"
                                        onClick={() => handleEdit(section)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        color="danger"
                                        size="sm"
                                        onClick={() => handleDelete(section.id)}
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
                    {editingSection ? 'Edit Section' : 'Add New Section'}
                </ModalHeader>
                <Form onSubmit={handleSubmit}>
                    <ModalBody>
                        <FormGroup>
                            <Label for="name">Section Name</Label>
                            <Input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="semester">Semester</Label>
                            <Input
                                type="select"
                                name="semester"
                                id="semester"
                                value={formData.semester}
                                onChange={handleInputChange}
                            >
                                <option value="Fall">Fall</option>
                                <option value="Spring">Spring</option>
                                <option value="Summer">Summer</option>
                                <option value="Winter">Winter</option>
                            </Input>
                        </FormGroup>
                        <FormGroup>
                            <Label for="year">Year</Label>
                            <Input
                                type="number"
                                name="year"
                                id="year"
                                value={formData.year}
                                onChange={handleInputChange}
                                min="2000"
                                max="2100"
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

export default Sections;