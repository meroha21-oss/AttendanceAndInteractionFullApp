import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext"; // <-- استيراد useAuth

import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button, FormGroup, Form, Input, Modal, ModalHeader, ModalBody, Table } from "reactstrap";

function Courses() {
    const [courses, setCourses] = useState([]);
    const [modal, setModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [loading, setLoading] = useState(false);
    const { apiRequest } = useAuth(); // <-- استخدام apiRequest من الـ context
    const { notify, NotificationAlertComponent } = useNotification();
    const [formData, setFormData] = useState({ code: "", name: "", is_active: true });

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            const response = await apiRequest('/admin/courses'); // <-- استخدام apiRequest
            const result = await response.json();
            if (result.success) {
                setCourses(result.data);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            notify("danger", "فشل جلب الكورسات");
        }
    };

    const toggleModal = () => setModal(!modal);
    const resetForm = () => { setFormData({ code: "", name: "", is_active: true }); setEditingCourse(null); };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setFormData({ name: course.name, is_active: !!course.is_active });
        toggleModal();
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            let response;
            if (editingCourse) {
                response = await apiRequest(`/admin/courses/${editingCourse.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                response = await apiRequest('/admin/courses', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }

            const result = await response.json();
            if (result.success) {
                notify("success", editingCourse ? "تم تحديث الكورس بنجاح" : "تم إنشاء الكورس بنجاح");
                fetchCourses();
                toggleModal();
                resetForm();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            const message = error.response?.data?.message || "فشلت العملية";
            notify("danger", message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
        try {
            const response = await apiRequest(`/admin/courses/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                notify("success", "تم حذف الكورس");
                fetchCourses();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            notify("danger", "فشل حذف الكورس");
        }
    };

    return (
        <>

            <div className="content">
                <Row>
                    <Col md="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h4">إدارة الكورسات</CardTitle>
                                <Button color="primary" onClick={() => { resetForm(); toggleModal(); }}>إضافة كورس</Button>
                            </CardHeader>
                            <CardBody>
                                <Table responsive>
                                    <thead className="text-primary">
                                    <tr><th>الكود</th><th>الاسم</th><th>الحالة</th><th>إجراءات</th></tr>
                                    </thead>
                                    <tbody>
                                    {courses.map(course => (
                                        <tr key={course.id}>
                                            <td>{course.code}</td>
                                            <td>{course.name}</td>
                                            <td>{course.is_active ? "نشط" : "غير نشط"}</td>
                                            <td>
                                                <Button color="success" size="sm" onClick={() => handleEdit(course)}>تعديل</Button>
                                                <Button color="danger" size="sm" onClick={() => handleDelete(course.id)}>حذف</Button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Modal isOpen={modal} toggle={toggleModal}>
                    <ModalHeader toggle={toggleModal}>{editingCourse ? "تعديل كورس" : "إضافة كورس جديد"}</ModalHeader>
                    <ModalBody>
                        <Form onSubmit={handleSubmit}>
                            <FormGroup>
                                <label>الكود</label>
                                <Input type="text" value={formData.code} onChange={(e)=>setFormData({...formData, code:e.target.value})} disabled={!!editingCourse} required />
                            </FormGroup>
                            <FormGroup>
                                <label>الاسم</label>
                                <Input type="text" name="name" value={formData.name} onChange={(e)=>setFormData({...formData, name:e.target.value})} required />
                            </FormGroup>
                            <FormGroup>
                                <label>الحالة</label>
                                <Input type="select" value={formData.is_active} onChange={(e)=>setFormData({...formData, is_active: e.target.value === 'true'})}>
                                    <option value="true">نشط</option>
                                    <option value="false">غير نشط</option>
                                </Input>
                            </FormGroup>
                            <Button color="primary" type="submit" disabled={loading}>
                                {loading ? "جاري الحفظ..." : "حفظ"}
                            </Button>
                        </Form>
                    </ModalBody>
                </Modal>
            </div>
        </>
    );
}

export default Courses;