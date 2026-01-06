import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {useAuth} from "../../context/AuthContext";

import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button, FormGroup, Form, Input, Label } from "reactstrap";
function Register() {
    const api = useAuth();
    const [userData, setUserData] = useState({ full_name: "", email: "", phone: "", password: "", password_confirmation: "", role: "student" });
    const [loading, setLoading] = useState(false);
    const { notify, NotificationAlertComponent } = useNotification();
    const navigate = useNavigate();
    const handleChange = (e) => setUserData({ ...userData, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault(); if (userData.password !== userData.password_confirmation) { notify("danger", "كلمتا المرور غير متطابقتين"); return; }
        setLoading(true);
        try {
            const formData = new FormData(); for (const key in userData) { formData.append(key, userData[key]); }
            await api.post('/register', formData); notify("success", "تم إنشاء المستخدم بنجاح"); navigate('/admin/dashboard');
        } catch (error) { const message = error.response?.data?.message || "فشل إنشاء المستخدم"; notify("danger", message); }
        finally { setLoading(false); }
    };
    return (
        <>

            <div className="content">
                <Row><Col md="8"><Card><CardHeader><CardTitle tag="h5">إنشاء مستخدم جديد</CardTitle></CardHeader><CardBody>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup><Label>الاسم الكامل</Label><Input name="full_name" type="text" value={userData.full_name} onChange={handleChange} required /></FormGroup>
                        <FormGroup><Label>البريد الإلكتروني</Label><Input name="email" type="email" value={userData.email} onChange={handleChange} required /></FormGroup>
                        <FormGroup><Label>رقم الهاتف</Label><Input name="phone" type="text" value={userData.phone} onChange={handleChange} required /></FormGroup>
                        <FormGroup><Label>الدور</Label><Input type="select" name="role" value={userData.role} onChange={handleChange}><option value="student">طالب</option><option value="teacher">مدرس</option><option value="admin">مدير</option></Input></FormGroup>
                        <FormGroup><Label>كلمة المرور</Label><Input name="password" type="password" value={userData.password} onChange={handleChange} required /></FormGroup>
                        <FormGroup><Label>تأكيد كلمة المرور</Label><Input name="password_confirmation" type="password" value={userData.password_confirmation} onChange={handleChange} required /></FormGroup>
                        <Button color="primary" type="submit" disabled={loading}>{loading ? "جاري الإنشاء..." : "إنشاء مستخدم"}</Button>
                    </Form>
                </CardBody></Card></Col></Row>
            </div>
        </>
    );
}
export default Register;