import React, { useState, useEffect } from "react";
import  {useAuth} from "../../context/AuthContext";


import { Card, CardBody, CardHeader, CardTitle, Row, Col, Button, FormGroup, Form, Input, Modal, ModalHeader, ModalBody, Table } from "reactstrap";

function Sections() {
    const [items, setItems] = useState([]);
    const [modal, setModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const { notify, NotificationAlertComponent } = useNotification();
    const [formData, setFormData] = useState({ name: "", semester: "Fall", year: new Date().getFullYear(), is_active: true });
    const { apiRequest } = useAuth();

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        try { const response = await apiRequest.get('/admin/sections'); setItems(response.data.data); }
        catch (error) { notify("danger", "فشل جلب الأقسام"); }
    };

    const toggleModal = () => setModal(!modal);
    const resetForm = () => { setFormData({ name: "", semester: "Fall", year: new Date().getFullYear(), is_active: true }); setEditingItem(null); };

    const handleEdit = (item) => { setEditingItem(item); setFormData({ name: item.name, is_active: !!item.is_active }); toggleModal(); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            if (editingItem) { await apiRequest.put(`/admin/sections/${editingItem.id}`, formData); notify("success", "تم التحديث"); }
            else { await apiRequest.post('/admin/sections', formData); notify("success", "تم الإنشاء"); }
            fetchItems(); toggleModal(); resetForm();
        } catch (error) { notify("danger", "فشلت العملية"); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => { if (!window.confirm("هل أنت متأكد؟")) return; try { await apiRequest.delete(`/admin/sections/${id}`); notify("success", "تم الحذف"); fetchItems(); } catch (error) { notify("danger", "فشل الحذف"); } };

    return (
        <>

            <div className="content">
                <Row><Col md="12"><Card><CardHeader><CardTitle tag="h4">إدارة الأقسام</CardTitle><Button color="primary" onClick={() => { resetForm(); toggleModal(); }}>إضافة قسم</Button></CardHeader><CardBody><Table responsive><thead className="text-primary"><tr><th>الاسم</th><th>الفصل</th><th>السنة</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>{items.map(item => (<tr key={item.id}><td>{item.name}</td><td>{item.semester}</td><td>{item.year}</td><td>{item.is_active ? "نشط" : "غير نشط"}</td><td><Button color="success" size="sm" onClick={() => handleEdit(item)}>تعديل</Button><Button color="danger" size="sm" onClick={() => handleDelete(item.id)}>حذف</Button></td></tr>))}</tbody></Table></CardBody></Card></Col></Row>
                <Modal isOpen={modal} toggle={toggleModal}><ModalHeader toggle={toggleModal}>{editingItem ? "تعديل قسم" : "إضافة قسم جديد"}</ModalHeader><ModalBody><Form onSubmit={handleSubmit}><FormGroup><label>الاسم</label><Input type="text" name="name" value={formData.name} onChange={(e)=>setFormData({...formData, name:e.target.value})} required /></FormGroup><FormGroup><label>الفصل</label><Input type="select" value={formData.semester} onChange={(e)=>setFormData({...formData, semester:e.target.value})}><option value="Fall">Fall</option><option value="Spring">Spring</option><option value="Summer">Summer</option></Input></FormGroup><FormGroup><label>السنة</label><Input type="number" name="year" value={formData.year} onChange={(e)=>setFormData({...formData, year:e.target.value})} required /></FormGroup><FormGroup><label>الحالة</label><Input type="select" value={formData.is_active} onChange={(e)=>setFormData({...formData, is_active: e.target.value === 'true'})}><option value="true">نشط</option><option value="false">غير نشط</option></Input></FormGroup><Button color="primary" type="submit" disabled={loading}>{loading ? "جاري الحفظ..." : "حفظ"}</Button></Form></ModalBody></Modal>
            </div>
        </>
    );
}

export default Sections;