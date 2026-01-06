import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminCourses from './pages/admin/Courses';
import AdminSections from './pages/admin/Sections';
import AdminEnrollments from './pages/admin/Enrollments';
import AdminAssignments from './pages/admin/Assignments';
import AdminStudents from './pages/admin/Students';
import AdminTeachers from './pages/admin/Teachers';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherLecturesToday from './pages/teacher/LecturesToday';
import TeacherLecturesWeek from './pages/teacher/LecturesWeek';
import TeacherLectureLive from './pages/teacher/LectureLive';
import LectureReport from './pages/teacher/LectureReport';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentLecturesToday from './pages/student/LecturesToday';
import StudentLecturesWeek from './pages/student/LecturesWeek';
import StudentLectureAttend from './pages/student/StudentLectureAttend';
import LectureSelect from './pages/student/LectureSelect';

function App() {
    return (
        <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            autoHideDuration={3000}
        >
            <Router>
                <AuthProvider>
                    <Routes>
                        {/* Auth Routes */}
                        <Route path="/login" element={
                            <AuthLayout>
                                <Login/>
                            </AuthLayout>
                        }/>
                        <Route path="/register" element={
                            <AuthLayout>
                                <Register/>
                            </AuthLayout>
                        }/>

                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminLayout/>}>
                            <Route index element={<Navigate to="dashboard" replace/>}/>
                            <Route path="dashboard" element={<AdminDashboard/>}/>
                            <Route path="courses" element={<AdminCourses/>}/>
                            <Route path="sections" element={<AdminSections/>}/>
                            <Route path="enrollments" element={<AdminEnrollments/>}/>
                            <Route path="assignments" element={<AdminAssignments/>}/>
                            <Route path="students" element={<AdminStudents/>}/>
                            <Route path="teachers" element={<AdminTeachers/>}/>
                        </Route>

                        {/* Teacher Routes */}
                        <Route path="/teacher" element={<TeacherLayout/>}>
                            <Route index element={<Navigate to="dashboard" replace/>}/>
                            <Route path="dashboard" element={<TeacherDashboard/>}/>
                            <Route path="lectures/today" element={<TeacherLecturesToday/>}/>
                            <Route path="lectures/week" element={<TeacherLecturesWeek/>}/>
                            <Route path="lectures/:lectureId/live" element={<TeacherLectureLive/>}/>
                            <Route path="lectures/:lectureId/report" element={<LectureReport/>}/>
                        </Route>

                        {/* Student Routes */}
                        <Route path="/student" element={<StudentLayout/>}>
                            <Route index element={<Navigate to="dashboard" replace/>}/>
                            <Route path="dashboard" element={<StudentDashboard/>}/>
                            <Route path="lectures/today" element={<StudentLecturesToday/>}/>
                            <Route path="lectures/week" element={<StudentLecturesWeek/>}/>
                            <Route path="lecture/attend/:lectureId" element={<StudentLectureAttend/>}/>
                            <Route path="lecture/select" element={<LectureSelect/>}/>
                        </Route>

                        {/* Default redirect */}
                        <Route path="/" element={<Navigate to="/login"/>}/>
                        <Route path="*" element={<Navigate to="/login"/>}/>
                    </Routes>
                </AuthProvider>
            </Router>
        </SnackbarProvider>
    );
}

export default App;