import React, { useState, useEffect } from "react";
import  {useAuth} from "../../context/AuthContext";

import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button, FormGroup, Form, Input, Modal, ModalHeader, ModalBody, Table } from "reactstrap";

function Assignments() {
    const [items, setItems] = useState([]);
    const [courses, setCourses] = useState([]);
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [modal, setModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const { notify, NotificationAlertComponent } = useNotification();
    const [formData, setFormData] = useState({ section_id: "", course_id: "", instructor_id: "", first_starts_at: "", duration_minutes: 120, total_lectures: 12 });
    const {api } = useAuth();
    useEffect(() => { fetchItems(); fetchOptions(); }, []);

    const fetchItems = async () => { try { const response = await api.get('/admin/assignments'); setItems(response.data.data); } catch (error) { notify("danger", "فشل جلب التعيينات"); } };
    const fetchOptions = async () => {
        try { const [cRes, sRes, tRes] = await Promise.all([api.get('/admin/courses'), api.get('/admin/sections'), api.get('/admin/users?role=teacher')]); setCourses(cRes.data.data); setSections(sRes.data.data); setTeachers(tRes.data.data); }
        catch (error) { console.error("Failed to fetch options"); }
    };

    const toggleModal = () => setModal(!modal);
    const resetForm = () => { setFormData({ section_id: "", course_id: "", instructor_id: "", first_starts_at: "", duration_minutes: 120, total_lectures: 12 }); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            await api.post('/admin/assignments', formData);
            notify("success", "تم إنشاء التعيين والمحاضرات بنجاح");
            fetchItems(); toggleModal(); resetForm();
        } catch (error) { notify("danger", error.response?.data?.message || "فشل الإنشاء"); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => { if (!window.confirm("هل أنت متأكد؟")) return; try { await api.delete(`/admin/assignments/${id}`); notify("success", "تم الحذف"); fetchItems(); } catch (error) { notify("danger", "فشل الحذف"); } };

    return (
        <>

            <div className="content">
                <Row><Col md="12"><Card><CardHeader><CardTitle tag="h4">إدارة التعيينات</CardTitle><Button color="primary" onClick={() => { resetForm(); toggleModal(); }}>إضافة تعيين</Button></CardHeader><CardBody><Table responsive><thead className="text-primary"><tr><th>الكورس</th><th>القسم</th><th>المدرس</th><th>عدد المحاضرات</th><th>إجراءات</th></tr></thead><tbody>{items.map(item => (<tr key={item.id}><td>{item.course.name}</td><td>{item.section.name}</td><td>{item.instructor.full_name}</td><td>{item.total_lectures}</td><td><Button color="danger" size="sm" onClick={() => handleDelete(item.id)}>حذف</Button></td></tr>))}</tbody></Table></CardBody></Card></Col></Row>
                <Modal isOpen={modal} toggle={toggleModal}><ModalHeader toggle={toggleModal}>إضافة تعيين جديد</ModalHeader><ModalBody><Form onSubmit={handleSubmit}><FormGroup><label>القسم</label><Input type="select" name="section_id" value={formData.section_id} onChange={(e)=>setFormData({...formData, section_id:e.target.value})} required><option value="">اختر قسم</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Input></FormGroup><FormGroup><label>الكورس</label><Input type="select" name="course_id" value={formData.course_id} onChange={(e)=>setFormData({...formData, course_id:e.target.value})} required><option value="">اختر كورس</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Input></FormGroup><FormGroup><label>المدرس</label><Input type="select" name="instructor_id" value={formData.instructor_id} onChange={(e)=>setFormData({...formData, instructor_id:e.target.value})} required><option value="">اختر مدرس</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}</Input></FormGroup><FormGroup><label>وقت بدء المحاضرة الأولى</label><Input type="datetime-local" name="first_starts_at" value={formData.first_starts_at} onChange={(e)=>setFormData({...formData, first_starts_at:e.target.value})} required /></FormGroup><FormGroup><label>مدة المحاضرة (دقائق)</label><Input type="number" name="duration_minutes" value={formData.duration_minutes} onChange={(e)=>setFormData({...formData, duration_minutes:e.target.value})} required /></FormGroup><FormGroup><label>إجمالي المحاضرات</label><Input type="number" name="total_lectures" value={formData.total_lectures} onChange={(e)=>setFormData({...formData, total_lectures:e.target.value})} required /></FormGroup><Button color="primary" type="submit" disabled={loading}>{loading ? "جاري الإنشاء..." : "إنشاء"}</Button></Form></ModalBody></Modal>
            </div>
        </>
    );
}

export default Assignments;