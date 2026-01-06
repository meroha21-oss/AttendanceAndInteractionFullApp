import React, { useState, useEffect } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Toast,
    ToastBody,
    ToastHeader
} from 'reactstrap';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
// import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLoggedin, setLoggedin] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const { login } = useAuth();

    // Clear error when inputs change
    useEffect(() => {
        if (error) {
            setError('');
        }
    }, [email, password]);

    // Auto-hide toast after successful login
    useEffect(() => {
        if (isLoggedin && showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isLoggedin, showToast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError('Please enter both email and password');
            setLoading(false);
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            setLoggedin(true);
            setShowToast(true);
        } else {
            setError(result.error || 'Login failed');
        }

        setLoading(false);
    };

    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <h2 className="text-center mb-4">Login</h2>
                            <Form onSubmit={handleSubmit}>
                                <FormGroup className="pb-2 mr-sm-2 mb-sm-0">
                                    <Label for="exampleEmail" className="mr-sm-2">
                                        Email
                                    </Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        id="exampleEmail"
                                        placeholder="something@idk.cool"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                    />
                                </FormGroup>
                                <FormGroup className="pb-2 mr-sm-2 mb-sm-0">
                                    <Label for="examplePassword" className="mr-sm-2">
                                        Password
                                    </Label>
                                    <Input
                                        type="password"
                                        name="password"
                                        id="examplePassword"
                                        placeholder="keep it safe ;)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </FormGroup>
                                <Button
                                    type="submit"
                                    color="primary"
                                    disabled={loading}
                                    className="mt-3"
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                            </Form>
                        </CardBody>
                    </Card>

                    <Card className="mt-5">
                        <CardBody>
                            {error && (
                                <div className="p-3 bg-danger text-white my-2 rounded">
                                    <div className="font-weight-bold">Error</div>
                                    <div>{error}</div>
                                </div>
                            )}

                            {isLoggedin && showToast && (
                                <div className="p-3 bg-success text-white my-2 rounded">
                                    <Toast>
                                        <ToastHeader>Login Successful!</ToastHeader>
                                        <ToastBody>
                                            You have successfully logged in. Welcome back!
                                        </ToastBody>
                                    </Toast>
                                </div>
                            )}

                            {!isLoggedin && !error && (
                                <div>
                                    Please login with your credentials.
                                    <br />
                                    <small className="text-muted">
                                        Need help? Contact support if you're having trouble logging in.
                                    </small>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;