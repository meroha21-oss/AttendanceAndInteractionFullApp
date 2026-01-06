import React, { useState } from 'react';
import { Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import { authService } from '../../services/authService';
import { useSnackbar } from 'notistack';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const { enqueueSnackbar } = useSnackbar();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await authService.forgotPassword(email);
            if (response.data.success) {
                setSuccess(true);
                enqueueSnackbar('Password reset instructions sent to your email', { variant: 'success' });
            } else {
                setError(response.data.message || 'Failed to send reset instructions');
                enqueueSnackbar(response.data.message || 'Failed to send reset instructions', { variant: 'error' });
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            enqueueSnackbar('An error occurred. Please try again.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Forgot Password" subtitle="Enter your email to reset your password">
            {error && <Alert color="danger">{error}</Alert>}
            {success && (
                <Alert color="success">
                    Password reset instructions have been sent to your email. Please check your inbox.
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <FormGroup>
                    <Label for="email">Email Address</Label>
                    <Input
                        type="email"
                        name="email"
                        id="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading || success}
                    />
                </FormGroup>

                <Button color="primary" block type="submit" disabled={loading || success}>
                    {loading ? 'Sending...' : 'Send Reset Instructions'}
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

export default ForgotPassword;