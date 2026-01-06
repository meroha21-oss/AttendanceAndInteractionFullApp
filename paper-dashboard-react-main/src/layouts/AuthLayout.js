import React from 'react';
import { Container, Row, Col, Card, CardBody } from 'reactstrap';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="auth-layout" style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            padding: '20px 0',
        }}>
            <Container>
                <Row className="justify-content-center">
                    <Col md="6" lg="5" xl="4">
                        <div className="text-center mb-4">
                            <Link to="/" className="text-white" style={{ textDecoration: 'none' }}>
                                <h2 className="text-white">School Management System</h2>
                            </Link>
                            <p className="text-white-50">Student-Teacher Admin Dashboard</p>
                        </div>

                        <Card className="shadow-lg">
                            <CardBody className="p-4">
                                {title && (
                                    <div className="text-center mb-4">
                                        <h4>{title}</h4>
                                        {subtitle && <p className="text-muted">{subtitle}</p>}
                                    </div>
                                )}

                                {children}

                                <div className="text-center mt-4">
                                    <p className="mb-0">
                                        <Link to="/login" className="text-primary">Back to Login</Link>
                                    </p>
                                </div>
                            </CardBody>
                        </Card>

                        <div className="text-center mt-4">
                            <p className="text-white-50 mb-0">
                                &copy; {new Date().getFullYear()} School Management System. All rights reserved.
                            </p>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default AuthLayout;