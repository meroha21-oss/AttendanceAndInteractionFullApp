import React from "react"; import { Row, Col, Card, CardTitle, CardBody } from "reactstrap";
function StudentDashboard() {
    return (<div className="content"><Row><Col lg="6" md="12"><Card><CardBody><CardTitle tag="h5">محاضرتك القادمة</CardTitle><p>قواعد البيانات - القسم B</p><p>الوقت: 12:00 ظهرًا</p></CardBody></Card></Col><Col lg="6" md="12"><Card><CardBody><CardTitle tag="h5">نسبة الحضور هذا الأسبوع</CardTitle><h3>98%</h3></CardBody></Card></Col></Row></div>);
}
export default StudentDashboard;