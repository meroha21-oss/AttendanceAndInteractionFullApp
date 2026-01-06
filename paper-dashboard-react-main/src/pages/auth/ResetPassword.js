import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Alert, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { authService } from '../../services/authService';
import { useSnackbar } from 'notistack';

const ResetPassword = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const [formData, setFormData] = useState({
        email: queryParams.get('email') || '',
        code: queryParams.get('code') || '',
        password: '',
        password_confirmation: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const { enqueueSnackbar } = useSnackbar();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
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
            const response = await authService.resetPassword(
                formData.email,
                formData.code,
                formData.password,
                formData.password_confirmation
            );

            if (response.data.success) {
                setSuccess(true);
                enqueueSnackbar('Password reset successfully! You can now login with your new password.', {
                    variant: 'success'
                });
            } else {
                setError(response.data.message || 'Failed to reset password');
                enqueueSnackbar(response.data.message || 'Failed to reset password', { variant: 'error' });
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            enqueueSnackbar('An error occurred. Please try again.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Reset Password" subtitle="Enter your new password">
            {error && <Alert color="danger">{error}</Alert>}
            {success && (
                <Alert color="success">
                    Password reset successfully! You can now <Link to="/login">login</Link> with your new password.
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <FormGroup>
                    <Label for="email">Email Address</Label>
                    <Input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={loading || success}
                        readOnly={!!queryParams.get('email')}
                    />
                </FormGroup>

                <FormGroup>
                    <Label for="code">Verification Code</Label>
                    <Input
                        type="text"
                        name="code"
                        id="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        required
                        disabled={loading || success}
                        readOnly={!!queryParams.get('code')}
                    />
                </FormGroup>

                <Row>
                    <Col md="6">
                        <FormGroup>
                            <Label for="password">New Password</Label>
                            <Input
                                type="password"
                                name="password"
                                id="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                disabled={loading || success}
                            />
                        </FormGroup>
                    </Col>
                    <Col md="6">
                        <FormGroup>
                            <Label for="password_confirmation">Confirm New Password</Label>
                            <Input
                                type="password"
                                name="password_confirmation"
                                id="password_confirmation"
                                value={formData.password_confirmation}
                                onChange={handleInputChange}
                                required
                                disabled={loading || success}
                            />
                        </FormGroup>
                    </Col>
                </Row>

                <Button color="primary" block type="submit" disabled={loading || success}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
            </Form>

            <div className="text-center mt-4">
                <p className="mb-0">
                    Remember your password?{' '}
                    <Link to="/login" className="text-primary fw-semibold">
                        Sign In
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default ResetPassword;