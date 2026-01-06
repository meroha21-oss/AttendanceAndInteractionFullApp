import React from "react";
import { Row, Col, Card, CardTitle, CardBody } from "reactstrap";
function AdminDashboard() {
    return (
        <div className="content">
            <Row>
                <Col lg="3" md="6" sm="6"><Card className="card-stats"><CardBody><CardTitle tag="h5">إجمالي الكورسات</CardTitle><p className="card-category">هذا الأسبوع</p><h3 className="card-title">15</h3></CardBody></Card></Col>
                <Col lg="3" md="6" sm="6"><Card className="card-stats"><CardBody><CardTitle tag="h5">إجمالي الطلاب</CardTitle><p className="card-category">مُسجلين</p><h3 className="card-title">250</h3></CardBody></Card></Col>
                <Col lg="3" md="6" sm="6"><Card className="card-stats"><CardBody><CardTitle tag="h5">إجمالي المدرسين</CardTitle><p className="card-category">نشطين</p><h3 className="card-title">12</h3></CardBody></Card></Col>
                <Col lg="3" md="6" sm="6"><Card className="card-stats"><CardBody><CardTitle tag="h5">المحاضرات اليوم</CardTitle><p className="card-category">قيد التشغيل</p><h3 className="card-title">5</h3></CardBody></Card></Col>
            </Row>
        </div>
    );
}
export default AdminDashboard;