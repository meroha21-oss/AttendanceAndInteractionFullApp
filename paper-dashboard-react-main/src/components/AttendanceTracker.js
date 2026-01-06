import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

import { Card, CardBody, CardTitle } from "reactstrap";

const AttendanceTracker = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState('idle');
    const [lecture, setLecture] = useState(null);
    const heartbeatInterval = useRef(null);
    const idleTimeout = useRef(null);
    const resetIdleTimer = () => { if (idleTimeout.current) clearTimeout(idleTimeout.current); idleTimeout.current = setTimeout(() => { stopTracking("idle_logout"); }, 15 * 60 * 1000); };
    const {api} = useAuth();
    const startTracking = async (currentLecture) => {
        try {
            const response = await api.post('/student/attendance/token', { lecture_id: currentLecture.id });
            const { token } = response.data.data; setStatus('tracking'); setLecture(currentLecture);
            notify("success", `تم بدء تتبع الحضور لمحاضرة: ${currentLecture.course.name}`);
            api.post('/student/attendance/heartbeat', { token }).catch(console.error);
            heartbeatInterval.current = setInterval(() => { api.post('/student/attendance/heartbeat', { token }).catch(err => { console.error("Heartbeat failed:", err); stopTracking("error"); }); }, 10 * 60 * 1000);
            document.addEventListener('mousemove', resetIdleTimer); document.addEventListener('keypress', resetIdleTimer); document.addEventListener('click', resetIdleTimer); document.addEventListener('scroll', resetIdleTimer); resetIdleTimer();
        } catch (error) { notify("danger", "فشل بدء تتبع الحضور: " + (error.response?.data?.message || "")); }
    };
    const stopTracking = (reason = 'manual') => {
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        if (idleTimeout.current) clearTimeout(idleTimeout.current);
        document.removeEventListener('mousemove', resetIdleTimer); document.removeEventListener('keypress', resetIdleTimer); document.removeEventListener('click', resetIdleTimer); document.removeEventListener('scroll', resetIdleTimer);
        setStatus(reason === 'idle_logout' ? 'idle_logout' : 'idle'); setLecture(null);
        if (reason === 'idle_logout') { notify("warning", "تم تسجيل خروجك بسبب عدم النشاط."); } else if (reason === 'error') { notify("danger", "توقف تتبع الحضور بسبب خطأ في الشبكة."); }
    };
    useEffect(() => {
        const checkForActiveLecture = async () => {
            if (user?.role !== 'student') return;
            try {
                const response = await api.get('/student/lectures/today');
                const activeLecture = response.data.data.find(l => l.status === 'running');
                if (activeLecture && status !== 'tracking') { startTracking(activeLecture); }
                else if (!activeLecture && status === 'tracking') { stopTracking('lecture_ended'); }
            } catch (error) { console.error("Failed to check for active lecture:", error); }
        };
        const intervalId = setInterval(checkForActiveLecture, 5000); checkForActiveLecture();
        return () => { clearInterval(intervalId); stopTracking(); };
    }, [user, status]);
    if (user?.role !== 'student' || status === 'idle') return null;
    return (
        <>

            <Card className="card-stats" style={{ position: 'fixed', bottom: 20, right: 20, width: 300, zIndex: 1000 }}>
                <CardBody>
                    <CardTitle tag="h5">
                        {status === 'tracking' && <span className="nc-icon nc-check-2" style={{ color: 'green' }}></span>}
                        {status === 'idle_logout' && <span className="nc-icon nc-simple-remove" style={{ color: 'red' }}></span>}
                        {" "}الحضور
                    </CardTitle>
                    <p>{status === 'tracking' && `حاضر في: ${lecture?.course.name}`}{status === 'idle_logout' && 'تم تسجيل خروجك'}</p>
                </CardBody>
            </Card>
        </>
    );
};
export default AttendanceTracker;