import React, { useState, useEffect } from "react";
import {useAuth} from "../../context/AuthContext";

import { Card, CardBody, CardHeader, CardTitle, Table } from "reactstrap";

function TodayLectures() {
    const [lectures, setLectures] = useState([]);
    const { notify, NotificationAlertComponent } = useNotification();
    const api = useAuth();
    useEffect(() => {
        const fetchLectures = async () => {
            try {
                const response = await api.get('/student/lectures/today');
                setLectures(response.data.data);
            } catch (error) {
                notify("danger", "فشل جلب جدول اليوم");
            }
        };
        fetchLectures();
    }, [notify]);

    return (
        <>

            <div className="content">
                <Card>
                    <CardHeader>
                        <CardTitle tag="h4">جدول اليوم</CardTitle>
                    </CardHeader>
                    <CardBody>
                        <Table responsive>
                            <thead>
                            <tr>
                                <th>الكورس</th>
                                <th>القسم</th>
                                <th>الوقت</th>
                                <th>الحالة</th>
                            </tr>
                            </thead>
                            <tbody>
                            {lectures.map(lecture => (
                                <tr key={lecture.id}>
                                    <td>{lecture.course.name}</td>
                                    <td>{lecture.section.name}</td>
                                    <td>{new Date(lecture.starts_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td>{lecture.status}</td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}

export default TodayLectures;