import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardText,
    Table,
    Button,
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext'; // تأكد من المسار الصحيح

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        teachers: 0,
        courses: 0,
        sections: 0,
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const { enqueueSnackbar } = useSnackbar();
    const { apiRequest } = useAuth(); // استخدم apiRequest من AuthContext

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);

            // جلب بيانات الطلاب
            const studentsResponse = await apiRequest('/admin/students');
            if (studentsResponse.ok) {
                const studentsData = await studentsResponse.json();
                setStats(prev => ({
                    ...prev,
                    students: studentsData.data?.length || 0
                }));
            }

            // جلب بيانات المعلمين
            const teachersResponse = await apiRequest('/admin/teachers');
            if (teachersResponse.ok) {
                const teachersData = await teachersResponse.json();
                setStats(prev => ({
                    ...prev,
                    teachers: teachersData.data?.length || 0
                }));
            }

            // جلب بيانات الأقسام
            const sectionsResponse = await apiRequest('/admin/sections');
            if (sectionsResponse.ok) {
                const sectionsData = await sectionsResponse.json();
                setStats(prev => ({
                    ...prev,
                    sections: sectionsData.data?.length || 0
                }));
            }

            // جلب بيانات الكورسات
            const coursesResponse = await apiRequest('/admin/courses');
            if (coursesResponse.ok) {
                const coursesData = await coursesResponse.json();
                setStats(prev => ({
                    ...prev,
                    courses: coursesData.data?.length || 0
                }));
            }

            // جلب الأنشطة الحديثة (هذا مثال، قد تحتاج إلى تعديله حسب API الخاص بك)
            // إذا كان لديك API للأنشطة، استخدمه:
            // const activitiesResponse = await apiRequest('/admin/recent-activities');
            // if (activitiesResponse.ok) {
            //     const activitiesData = await activitiesResponse.json();
            //     setRecentActivities(activitiesData.data || []);
            // }

            // بدلاً من ذلك، يمكنك إنشاء أنشطة من البيانات الحالية
            updateRecentActivities();

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const updateRecentActivities = async () => {
        try {
            // جلب آخر 5 طلاب مسجلين
            const studentsResponse = await apiRequest('/admin/students');
            if (studentsResponse.ok) {
                const studentsData = await studentsResponse.json();
                const recentStudents = studentsData.data?.slice(0, 5).map(student => ({
                    id: student.id,
                    action: `New student registered: ${student.full_name}`,
                    user: student.full_name,
                    time: formatTimeAgo(student.created_at)
                }));

                // جلب آخر 5 معلمين
                const teachersResponse = await apiRequest('/admin/teachers');
                if (teachersResponse.ok) {
                    const teachersData = await teachersResponse.json();
                    const recentTeachers = teachersData.data?.slice(0, 5).map(teacher => ({
                        id: teacher.id,
                        action: `New teacher added: ${teacher.full_name}`,
                        user: teacher.full_name,
                        time: formatTimeAgo(teacher.created_at)
                    }));

                    // جلب آخر 5 كورسات
                    const coursesResponse = await apiRequest('/admin/courses');
                    if (coursesResponse.ok) {
                        const coursesData = await coursesResponse.json();
                        const recentCourses = coursesData.data?.slice(0, 5).map(course => ({
                            id: course.id,
                            action: `New course created: ${course.name}`,
                            user: 'Admin',
                            time: formatTimeAgo(course.created_at)
                        }));

                        // دمج وفرز الأنشطة حسب الوقت
                        const allActivities = [
                            ...recentStudents,
                            ...recentTeachers,
                            ...recentCourses
                        ].sort((a, b) => new Date(b.time) - new Date(a.time))
                            .slice(0, 10); // أخذ آخر 10 أنشطة فقط

                        setRecentActivities(allActivities);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating recent activities:', error);
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <>
            <h2 className="mb-4">Admin Dashboard</h2>

            {loading ? (
                <div className="text-center py-5">
                    <i className="ni ni-spin ni-circle-08" style={{ fontSize: '3rem' }}></i>
                    <p>Loading dashboard data...</p>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <Row className="mb-4">
                        <Col md="3">
                            <Card className="card-stats">
                                <CardBody>
                                    <Row>
                                        <Col xs="5">
                                            <div className="icon-big text-center icon-warning">
                                                <i className="ni ni-single-02 text-primary"></i>
                                            </div>
                                        </Col>
                                        <Col xs="7">
                                            <div className="numbers">
                                                <p className="card-category">Students</p>
                                                <CardTitle tag="h4">{stats.students}</CardTitle>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md="3">
                            <Card className="card-stats">
                                <CardBody>
                                    <Row>
                                        <Col xs="5">
                                            <div className="icon-big text-center icon-warning">
                                                <i className="ni ni-hat-3 text-success"></i>
                                            </div>
                                        </Col>
                                        <Col xs="7">
                                            <div className="numbers">
                                                <p className="card-category">Teachers</p>
                                                <CardTitle tag="h4">{stats.teachers}</CardTitle>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md="3">
                            <Card className="card-stats">
                                <CardBody>
                                    <Row>
                                        <Col xs="5">
                                            <div className="icon-big text-center icon-warning">
                                                <i className="ni ni-book-bookmark text-danger"></i>
                                            </div>
                                        </Col>
                                        <Col xs="7">
                                            <div className="numbers">
                                                <p className="card-category">Courses</p>
                                                <CardTitle tag="h4">{stats.courses}</CardTitle>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col md="3">
                            <Card className="card-stats">
                                <CardBody>
                                    <Row>
                                        <Col xs="5">
                                            <div className="icon-big text-center icon-warning">
                                                <i className="ni ni-bullet-list-67 text-warning"></i>
                                            </div>
                                        </Col>
                                        <Col xs="7">
                                            <div className="numbers">
                                                <p className="card-category">Sections</p>
                                                <CardTitle tag="h4">{stats.sections}</CardTitle>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Quick Actions */}
                    <Row className="mb-4">
                        <Col>
                            <Card>
                                <CardBody>
                                    <CardTitle tag="h5">Quick Actions</CardTitle>
                                    <Row className="mt-3">
                                        <Col md="3" className="mb-3">
                                            <Button
                                                color="primary"
                                                block
                                                tag={Link}
                                                to="/admin/courses"
                                            >
                                                <i className="ni ni-book-bookmark mr-2"></i>
                                                Manage Courses
                                            </Button>
                                        </Col>
                                        <Col md="3" className="mb-3">
                                            <Button
                                                color="success"
                                                block
                                                tag={Link}
                                                to="/admin/sections"
                                            >
                                                <i className="ni ni-bullet-list-67 mr-2"></i>
                                                Manage Sections
                                            </Button>
                                        </Col>
                                        <Col md="3" className="mb-3">
                                            <Button
                                                color="info"
                                                block
                                                tag={Link}
                                                to="/admin/students"
                                            >
                                                <i className="ni ni-single-copy-04 mr-2"></i>
                                                Manage Students
                                            </Button>
                                        </Col>
                                        <Col md="3" className="mb-3">
                                            <Button
                                                color="warning"
                                                block
                                                tag={Link}
                                                to="/admin/teachers"
                                            >
                                                <i className="ni ni-calendar-grid-58 mr-2"></i>
                                                Manage Teachers
                                            </Button>
                                        </Col>
                                    </Row>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Recent Activities */}
                    <Row>
                        <Col>
                            <Card>
                                <CardBody>
                                    <CardTitle tag="h5">Recent Activities</CardTitle>
                                    {recentActivities.length > 0 ? (
                                        <Table responsive>
                                            <thead>
                                            <tr>
                                                <th>Action</th>
                                                <th>User</th>
                                                <th>Time</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {recentActivities.map((activity) => (
                                                <tr key={activity.id}>
                                                    <td>{activity.action}</td>
                                                    <td>{activity.user}</td>
                                                    <td>{activity.time}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-3">
                                            <p className="text-muted">No recent activities</p>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </>
    );
};

export default AdminDashboard;