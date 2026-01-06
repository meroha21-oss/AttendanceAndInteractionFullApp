import React, { useState, useEffect } from "react";
import {useAuth} from "../../context/AuthContext";

import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button, FormGroup, Form, Input, Modal, ModalHeader, ModalBody, Table } from "reactstrap";

function Enrollments() {
    const [items, setItems] = useState([]);
    const [students, setStudents] = useState([]);
    const [sections, setSections] = useState([]);
    const [modal, setModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const { notify, NotificationAlertComponent } = useNotification();
    const [formData, setFormData] = useState({ student_id: "", section_id: "" });
    const { api } = useAuth();

    useEffect(() => {
        fetchItems();
        fetchStudents();
        fetchSections();
    }, []);

    const fetchItems = async () => { try { const response = await api.get('/admin/enrollments'); setItems(response.data.data); } catch (error) { notify("danger", "فشل جلب التسجيلات"); } };
    const fetchStudents = async () => { try { const response = await api.get('/admin/users?role=student'); setStudents(response.data.data); } catch (error) { console.error("Failed to fetch students"); } };
    const fetchSections = async () => { try { const response = await api.get('/admin/sections'); setSections(response.data.data); } catch (error) { console.error("Failed to fetch sections"); } };

    const toggleModal = () => setModal(!modal);
    const resetForm = () => { setFormData({ student_id: "", section_id: "" }); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            await api.post('/admin/enrollments', formData);
            notify("success", "تم تسجيل الطالب بنجاح");
            fetchItems(); toggleModal(); resetForm();
        } catch (error) { notify("danger", error.response?.data?.message || "فشل التسجيل"); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => { if (!window.confirm("هل أنت متأكد؟")) return; try { await api.delete(`/admin/enrollments/${id}`); notify("success", "تم الحذف"); fetchItems(); } catch (error) { notify("danger", "فشل الحذف"); } };

    return (
        <>

            <div className="content">
                <Row><Col md="12"><Card><CardHeader><CardTitle tag="h4">إدارة التسجيل</CardTitle><Button color="primary" onClick={() => { resetForm(); toggleModal(); }}>تسجيل طالب</Button></CardHeader><CardBody><Table responsive><thead className="text-primary"><tr><th>الطالب</th><th>القسم</th><th>إجراءات</th></tr></thead><tbody>{items.map(item => (<tr key={item.id}><td>{item.student.full_name}</td><td>{item.section.name}</td><td><Button color="danger" size="sm" onClick={() => handleDelete(item.id)}>حذف التسجيل</Button></td></tr>))}</tbody></Table></CardBody></Card></Col></Row>
                <Modal isOpen={modal} toggle={toggleModal}><ModalHeader toggle={toggleModal}>تسجيل طالب جديد</ModalHeader><ModalBody><Form onSubmit={handleSubmit}><FormGroup><label>الطالب</label><Input type="select" name="student_id" value={formData.student_id} onChange={(e)=>setFormData({...formData, student_id:e.target.value})} required><option value="">اختر طالب</option>{students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}</Input></FormGroup><FormGroup><label>القسم</label><Input type="select" name="section_id" value={formData.section_id} onChange={(e)=>setFormData({...formData, section_id:e.target.value})} required><option value="">اختر قسم</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Input></FormGroup><Button color="primary" type="submit" disabled={loading}>{loading ? "جاري التسجيل..." : "تسجيل"}</Button></Form></ModalBody></Modal>
            </div>
        </>
    );
}

export default Enrollments;