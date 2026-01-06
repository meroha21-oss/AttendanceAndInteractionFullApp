import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../layouts/Admin';
import TeacherLayout from '../layouts/Teacher';
import StudentLayout from '../layouts/Student';

const RoleBasedLayout = () => {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated || !user) { return <Navigate to="/login" replace />; }
    switch (user.role) {
        case 'admin':
            console.log("🔍 RoleBasedLayout: جاري عرض AdminLayout");
            return <AdminLayout />;
        case 'teacher':
            console.log("🔍 RoleBasedLayout: جاري عرض TeacherLayout");
            return <TeacherLayout />;
        case 'student':
            console.log("🔍 RoleBasedLayout: جاري عرض StudentLayout");
            return <StudentLayout />;
        default: return <Navigate to="/login" replace />;
    }
};
export default RoleBasedLayout;