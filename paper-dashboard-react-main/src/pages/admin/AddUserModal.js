import React, { useState } from 'react';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    FormGroup,
    Label,
    Input,
    Button
} from 'reactstrap';

const AddUserModal = ({ isOpen, toggle, role, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        profile_photo: null,
        role: role
    });

    const [previewImage, setPreviewImage] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                profile_photo: file
            });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Create FormData for file upload
        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) {
                submitData.append(key, formData[key]);
            }
        });

        onSubmit(submitData);
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            password: '',
            password_confirmation: '',
            profile_photo: null,
            role: role
        });
        setPreviewImage(null);
    };

    const handleModalToggle = () => {
        resetForm();
        toggle();
    };

    return (
        <Modal isOpen={isOpen} toggle={handleModalToggle}>
            <ModalHeader toggle={handleModalToggle}>
                Add New {role === 'student' ? 'Student' : 'Teacher'}
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
                <ModalBody>
                    <FormGroup>
                        <Label for="full_name">Full Name *</Label>
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
                        <Label for="email">Email *</Label>
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
                        <Label for="phone">Phone *</Label>
                        <Input
                            type="tel"
                            name="phone"
                            id="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label for="password">Password *</Label>
                        <Input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            minLength="6"
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label for="password_confirmation">Confirm Password *</Label>
                        <Input
                            type="password"
                            name="password_confirmation"
                            id="password_confirmation"
                            value={formData.password_confirmation}
                            onChange={handleInputChange}
                            required
                            minLength="6"
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label for="profile_photo">Profile Photo</Label>
                        <div className="mb-3">
                            {previewImage && (
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="img-thumbnail mb-2"
                                    style={{ width: '100px', height: '100px' }}
                                />
                            )}
                        </div>
                        <Input
                            type="file"
                            name="profile_photo"
                            id="profile_photo"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <small className="text-muted">
                            Optional. Supported formats: JPG, PNG, GIF. Max size: 2MB
                        </small>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button type="submit" color="primary" disabled={loading}>
                        {loading ? 'Adding...' : `Add ${role === 'student' ? 'Student' : 'Teacher'}`}
                    </Button>
                    <Button color="secondary" onClick={handleModalToggle}>
                        Cancel
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default AddUserModal;