import React, { useState } from 'react';
import { Form, FormGroup, Label, Input, Button, Alert, Row, Col } from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const Register = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role: 'student',
        profile_photo: null,
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                profile_photo: file,
            });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const result = await register(formData);
            if (result.success) {
                enqueueSnackbar(result.message || 'Registration successful! Please check your email for verification.', {
                    variant: 'success'
                });
                navigate('/login');
            } else {
                setError(result.error || 'Registration failed');
                enqueueSnackbar(result.error || 'Registration failed', { variant: 'error' });
            }
        } catch (err) {
            setError('An error occurred during registration');
            enqueueSnackbar('An error occurred during registration', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Create Account" subtitle="Register as admin, teacher, or student">
            {error && <Alert color="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col md="6">
                        <FormGroup>
                            <Label for="full_name">Full Name *</Label>
                            <Input
                                type="text"
                                name="full_name"
                                id="full_name"
                                placeholder="Enter your full name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="6">
                        <FormGroup>
                            <Label for="phone">Phone Number *</Label>
                            <Input
                                type="tel"
                                name="phone"
                                id="phone"
                                placeholder="Enter your phone number"
                                value={formData.phone}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </FormGroup>
                    </Col>
                </Row>

                <FormGroup>
                    <Label for="email">Email Address *</Label>
                    <Input
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                </FormGroup>

                <Row>
                    <Col md="6">
                        <FormGroup>
                            <Label for="password">Password *</Label>
                            <Input
                                type="password"
                                name="password"
                                id="password"
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="6">
                        <FormGroup>
                            <Label for="password_confirmation">Confirm Password *</Label>
                            <Input
                                type="password"
                                name="password_confirmation"
                                id="password_confirmation"
                                placeholder="Confirm password"
                                value={formData.password_confirmation}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </FormGroup>
                    </Col>
                </Row>

                <FormGroup>
                    <Label for="role">Role *</Label>
                    <Input
                        type="select"
                        name="role"
                        id="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                    </Input>
                </FormGroup>

                <FormGroup>
                    <Label for="profile_photo">Profile Photo</Label>
                    <Input
                        type="file"
                        name="profile_photo"
                        id="profile_photo"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                    {preview && (
                        <div className="mt-2">
                            <img
                                src={preview}
                                alt="Preview"
                                className="img-thumbnail"
                                style={{ width: '100px', height: '100px' }}
                            />
                        </div>
                    )}
                </FormGroup>

                <Button color="primary" block type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
            </Form>

            <div className="text-center mt-4">
                <p className="mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary fw-semibold">
                        Sign In
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default Register;