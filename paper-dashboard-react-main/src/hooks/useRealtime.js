// src/hooks/useRealtime.js
import { useEffect, useRef, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { getEcho, leaveChannel } from '../lib/echo';

export const useTeacherLectureRealtime = (lectureId, teacherId, callbacks = {}) => {
    const { enqueueSnackbar } = useSnackbar();

    // نخزن أسماء القنوات المشترك فيها
    const channelsRef = useRef([]);

    // ✅ نخزن callbacks داخل ref حتى ما يصير re-subscribe مع كل render
    const callbacksRef = useRef(callbacks);

    // ✅ نعرف آخر lecture/teacher اشتغلنا عليهم لمنع الاشتراك المتكرر
    const lastKeyRef = useRef(null);

    // تحديث callbacksRef بكل render (بدون ما نعمل subscribe من جديد)
    useEffect(() => {
        callbacksRef.current = callbacks || {};
    }, [callbacks]);

    const cleanupChannels = useCallback(() => {
        channelsRef.current.forEach((channelName) => {
            leaveChannel(channelName);
        });
        channelsRef.current = [];
        lastKeyRef.current = null;
    }, []);

    useEffect(() => {
        if (!teacherId || !lectureId) {
            console.log('Teacher ID or Lecture ID missing:', { teacherId, lectureId });
            cleanupChannels();
            return;
        }

        const echo = getEcho();
        if (!echo) {
            console.warn('Echo not available. User might not be authenticated.');
            // ✅ نستدعي callback الخطأ إذا لم نتمكن من الحصول على Echo
            callbacksRef.current?.onRealtimeError?.('Echo غير متاح - قد يكون المستخدم غير مسجل الدخول');
            return;
        }

        const key = `${teacherId}:${lectureId}`;

        // ✅ إذا نفس القيم السابقة، لا تعيد الاشتراك
        if (lastKeyRef.current === key) {
            return;
        }

        // ✅ لو كنا مشتركين بقنوات سابقة، نظفها أولاً
        cleanupChannels();
        lastKeyRef.current = key;

        console.log('✅ Setting up teacher real-time channels...');
        console.log('👨‍🏫 Teacher ID:', teacherId);
        console.log('📚 Lecture ID:', lectureId);

        try {
            // ✅ مراقبة حالة الاتصال مع Pusher
            if (echo.connector && echo.connector.pusher) {
                const pusher = echo.connector.pusher;

                // ✅ إضافة مستمعين لحالة الاتصال
                pusher.connection.bind('connecting', () => {
                    console.log('🔄 Connecting to Pusher...');
                    callbacksRef.current?.onRealtimeConnected?.('connecting');
                });

                pusher.connection.bind('connected', () => {
                    console.log('✅ Pusher connected successfully!');
                    callbacksRef.current?.onRealtimeConnected?.('connected');
                });

                pusher.connection.bind('disconnected', () => {
                    console.warn('❌ Pusher disconnected');
                    callbacksRef.current?.onRealtimeConnected?.('disconnected');
                });

                pusher.connection.bind('error', (error) => {
                    console.error('❌ Pusher error:', error);
                    callbacksRef.current?.onRealtimeError?.(error);
                });
            }

            // ===================== Teacher Channel =====================
            const teacherChannelName = `teacher.${teacherId}`;
            const teacherChannel = echo.channel(teacherChannelName);

            channelsRef.current.push(teacherChannelName);

            teacherChannel
                .subscribed(() => {
                    console.log(`✅ Subscribed: ${teacherChannelName}`);
                    // ✅ إعلام بالاتصال الناجح عند الاشتراك في القناة
                    callbacksRef.current?.onRealtimeConnected?.('connected');
                })
                .error((error) => {
                    console.error(`❌ Subscribe error (${teacherChannelName}):`, error);
                    callbacksRef.current?.onRealtimeError?.(error);
                });

            teacherChannel.listen('.attendance.updated', (data) => {
                console.log('✅ Attendance updated event:', data);
                callbacksRef.current?.onAttendanceUpdated?.(data);
            });

            teacherChannel.listen('.answer.submitted', (data) => {
                console.log('✅ Answer submitted event:', data);
                callbacksRef.current?.onAnswerSubmitted?.(data);
            });

            // ===================== Lecture Channel =====================
            const lectureChannelName = `lecture.${lectureId}`;
            const lectureChannel = echo.channel(lectureChannelName);

            channelsRef.current.push(lectureChannelName);

            lectureChannel
                .subscribed(() => {
                    console.log(`✅ Subscribed: ${lectureChannelName}`);
                    // ✅ إعلام بالاتصال الناجح
                    callbacksRef.current?.onRealtimeConnected?.('connected');
                })
                .error((error) => {
                    console.error(`❌ Subscribe error (${lectureChannelName}):`, error);
                    callbacksRef.current?.onRealtimeError?.(error);
                });

            lectureChannel.listen('.chat.message.sent', (data) => {
                console.log('✅ Chat message sent event:', data);
                callbacksRef.current?.onChatMessageSent?.(data);
            });

            lectureChannel.listen('.question.published', (data) => {
                console.log('✅ Question published event:', data);
                callbacksRef.current?.onQuestionPublished?.(data);
            });

            lectureChannel.listen('.question.closed', (data) => {
                console.log('✅ Question closed event:', data);
                callbacksRef.current?.onQuestionClosed?.(data);
            });

            // ✅ إشعار بدء الاتصال
            callbacksRef.current?.onRealtimeConnected?.('connecting');

        } catch (error) {
            console.error('❌ Error setting up channels:', error);
            enqueueSnackbar('خطأ في إعداد الاتصال المباشر', { variant: 'error' });
            callbacksRef.current?.onRealtimeError?.(error);
        }

        return () => {
            console.log('🧹 Cleaning up teacher real-time channels');
            cleanupChannels();
            // ✅ إعلام بالانفصال عند التنظيف
            callbacksRef.current?.onRealtimeConnected?.('disconnected');
        };
    }, [lectureId, teacherId, enqueueSnackbar, cleanupChannels]);
};

export const useStudentLectureRealtime = (lectureId, studentId, callbacks = {}) => {
    const { enqueueSnackbar } = useSnackbar();

    // نخزن أسماء القنوات المشترك فيها
    const channelsRef = useRef([]);

    // ✅ نخزن callbacks داخل ref حتى ما يصير re-subscribe مع كل render
    const callbacksRef = useRef(callbacks);

    // ✅ نعرف آخر lecture/student اشتغلنا عليهم لمنع الاشتراك المتكرر
    const lastKeyRef = useRef(null);

    // تحديث callbacksRef بكل render (بدون ما نعمل subscribe من جديد)
    useEffect(() => {
        callbacksRef.current = callbacks || {};
    }, [callbacks]);

    const cleanupChannels = useCallback(() => {
        channelsRef.current.forEach((channelName) => {
            leaveChannel(channelName);
        });
        channelsRef.current = [];
        lastKeyRef.current = null;
    }, []);

    useEffect(() => {
        if (!studentId || !lectureId) {
            console.log('Student ID or Lecture ID missing:', { studentId, lectureId });
            cleanupChannels();
            return;
        }

        const echo = getEcho();
        if (!echo) {
            console.warn('Echo not available. User might not be authenticated.');
            // ✅ نستدعي callback الخطأ إذا لم نتمكن من الحصول على Echo
            callbacksRef.current?.onRealtimeError?.('Echo غير متاح - قد يكون المستخدم غير مسجل الدخول');
            return;
        }

        const key = `${studentId}:${lectureId}`;

        // ✅ إذا نفس القيم السابقة، لا تعيد الاشتراك
        if (lastKeyRef.current === key) {
            return;
        }

        // ✅ لو كنا مشتركين بقنوات سابقة، نظفها أولاً
        cleanupChannels();
        lastKeyRef.current = key;

        console.log('✅ Setting up student real-time channels...');
        console.log('👨‍🎓 Student ID:', studentId);
        console.log('📚 Lecture ID:', lectureId);

        try {
            // ✅ مراقبة حالة الاتصال مع Pusher
            if (echo.connector && echo.connector.pusher) {
                const pusher = echo.connector.pusher;

                // ✅ إضافة مستمعين لحالة الاتصال
                pusher.connection.bind('connecting', () => {
                    console.log('🔄 Connecting to Pusher...');
                    callbacksRef.current?.onRealtimeConnected?.('connecting');
                });

                pusher.connection.bind('connected', () => {
                    console.log('✅ Pusher connected successfully!');
                    callbacksRef.current?.onRealtimeConnected?.('connected');
                });

                pusher.connection.bind('disconnected', () => {
                    console.warn('❌ Pusher disconnected');
                    callbacksRef.current?.onRealtimeConnected?.('disconnected');
                });

                pusher.connection.bind('error', (error) => {
                    console.error('❌ Pusher error:', error);
                    callbacksRef.current?.onRealtimeError?.(error);
                });
            }

            // ===================== Student Channel =====================
            const studentChannelName = `student.${studentId}`;
            const studentChannel = echo.channel(studentChannelName);

            channelsRef.current.push(studentChannelName);

            studentChannel
                .subscribed(() => {
                    console.log(`✅ Subscribed: ${studentChannelName}`);
                    // ✅ إعلام بالاتصال الناجح عند الاشتراك في القناة
                    callbacksRef.current?.onRealtimeConnected?.('connected');
                })
                .error((error) => {
                    console.error(`❌ Subscribe error (${studentChannelName}):`, error);
                    callbacksRef.current?.onRealtimeError?.(error);
                });

            // ===================== Lecture Channel =====================
            const lectureChannelName = `lecture.${lectureId}`;
            const lectureChannel = echo.channel(lectureChannelName);

            channelsRef.current.push(lectureChannelName);

            lectureChannel
                .subscribed(() => {
                    console.log(`✅ Subscribed: ${lectureChannelName}`);
                    // ✅ إعلام بالاتصال الناجح
                    callbacksRef.current?.onRealtimeConnected?.('connected');
                })
                .error((error) => {
                    console.error(`❌ Subscribe error (${lectureChannelName}):`, error);
                    callbacksRef.current?.onRealtimeError?.(error);
                });

            // ✅ استمع للأحداث على قناة المحاضرة
            lectureChannel.listen('.chat.message.sent', (data) => {
                console.log('✅ Chat message sent event:', data);
                callbacksRef.current?.onChatMessageSent?.(data);
            });

            lectureChannel.listen('.question.published', (data) => {
                console.log('✅ Question published event:', data);
                callbacksRef.current?.onQuestionPublished?.(data);
            });

            lectureChannel.listen('.question.closed', (data) => {
                console.log('✅ Question closed event:', data);
                callbacksRef.current?.onQuestionClosed?.(data);
            });

            lectureChannel.listen('.lecture.ended', (data) => {
                console.log('✅ Lecture ended event:', data);
                callbacksRef.current?.onLectureEnded?.(data);
            });

            // ✅ استمع للأحداث على قناة الطالب
            studentChannel.listen('.answer.submitted', (data) => {
                console.log('✅ Answer submitted (student) event:', data);
                callbacksRef.current?.onAnswerSubmitted?.(data);
            });

            // ✅ إشعار بدء الاتصال
            callbacksRef.current?.onRealtimeConnected?.('connecting');

        } catch (error) {
            console.error('❌ Error setting up channels:', error);
            enqueueSnackbar('خطأ في إعداد الاتصال المباشر', { variant: 'error' });
            callbacksRef.current?.onRealtimeError?.(error);
        }

        return () => {
            console.log('🧹 Cleaning up student real-time channels');
            cleanupChannels();
            // ✅ إعلام بالانفصال عند التنظيف
            callbacksRef.current?.onRealtimeConnected?.('disconnected');
        };
    }, [lectureId, studentId, enqueueSnackbar, cleanupChannels]);

    return { connectionStatus: 'checking' };
};