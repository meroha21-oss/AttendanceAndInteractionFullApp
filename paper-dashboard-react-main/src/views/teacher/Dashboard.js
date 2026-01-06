import React from "react"; import { Row, Col, Card, CardTitle, CardBody } from "reactstrap";
function TeacherDashboard() {
    return (<div className="content"><Row><Col lg="6" md="12"><Card><CardBody><CardTitle tag="h5">محاضرتك القادمة</CardTitle><p>برمجة 1 - القسم A</p><p>الوقت: 10:00 صباحًا</p></CardBody></Card></Col><Col lg="6" md="12"><Card><CardBody><CardTitle tag="h5">إحصائيات هذا الأسبوع</CardTitle><p>عدد المحاضرات: 5</p><p>متوسط الحضور: 95%</p></CardBody></Card></Col></Row></div>);
}
export default TeacherDashboard;