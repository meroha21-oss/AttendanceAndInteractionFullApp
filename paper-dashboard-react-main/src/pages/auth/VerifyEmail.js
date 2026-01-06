import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Button, Alert, Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { authService } from '../../services/authService';
import { useSnackbar } from 'notistack';

const VerifyEmail = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const [formData, setFormData] = useState({
        email: queryParams.get('email') || '',
        code: '',
    });
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
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

        try {
            const response = await authService.verifyEmail(formData);
            if (response.data.success) {
                setSuccess(true);
                enqueueSnackbar('Email verified successfully! You can now login.', { variant: 'success' });
            } else {
                setError(response.data.message || 'Failed to verify email');
                enqueueSnackbar(response.data.message || 'Failed to verify email', { variant: 'error' });
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            enqueueSnackbar('An error occurred. Please try again.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!formData.email) {
            enqueueSnackbar('Please enter your email address', { variant: 'warning' });
            return;
        }

        setResending(true);
        try {
            const response = await authService.resendVerificationCode(formData.email);
            if (response.data.success) {
                enqueueSnackbar('Verification code sent to your email', { variant: 'success' });
            } else {
                enqueueSnackbar('Failed to send verification code', { variant: 'error' });
            }
        } catch (err) {
            enqueueSnackbar('An error occurred. Please try again.', { variant: 'error' });
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthLayout title="Verify Email" subtitle="Enter the verification code sent to your email">
            {error && <Alert color="danger">{error}</Alert>}
            {success && (
                <Alert color="success">
                    Email verified successfully! You can now <Link to="/login">login</Link>.
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
                    <Row>
                        <Col>
                            <Input
                                type="text"
                                name="code"
                                id="code"
                                placeholder="Enter 6-digit code"
                                value={formData.code}
                                onChange={handleInputChange}
                                required
                                disabled={loading || success}
                                maxLength="6"
                            />
                        </Col>
                        <Col xs="auto">
                            <Button
                                color="link"
                                onClick={handleResendCode}
                                disabled={resending || success}
                            >
                                {resending ? 'Sending...' : 'Resend Code'}
                            </Button>
                        </Col>
                    </Row>
                </FormGroup>

                <Button color="primary" block type="submit" disabled={loading || success}>
                    {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
            </Form>

            <div className="text-center mt-4">
                <p className="mb-0">
                    Already verified?{' '}
                    <Link to="/login" className="text-primary fw-semibold">
                        Sign In
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
};

export default VerifyEmail;