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
            // ===================== Teacher Channel =====================
            const teacherChannelName = `teacher.${teacherId}`;
            const teacherChannel = echo.channel(teacherChannelName);
            
            channelsRef.current.push(teacherChannelName);

            teacherChannel
                .subscribed(() => {
                    console.log(`✅ Subscribed: ${teacherChannelName}`);
                })
                .error((error) => {
                    console.error(`❌ Subscribe error (${teacherChannelName}):`, error);
                });

            teacherChannel.listen('.attendance.updated', (data) => {
                console.log('✅ Attendance updated event:', data);
                callbacksRef.current?.onAttendanceUpdated?.(data);
            });

            teacherChannel.listen('.answer.submitted', (data) => {
                console.log('✅ Answer submitted event:', data);
                callbacksRef.current?.onAnswerSubmitted?.(data);

                enqueueSnackbar(`إجابة جديدة من ${data.student?.full_name || 'طالب'}`, {
                    variant: 'info',
                    autoHideDuration: 3000,
                });
            });

            // ===================== Lecture Channel =====================
            const lectureChannelName = `lecture.${lectureId}`;
            const lectureChannel = echo.channel(lectureChannelName);

            channelsRef.current.push(lectureChannelName);

            lectureChannel
                .subscribed(() => {
                    console.log(`✅ Subscribed: ${lectureChannelName}`);
                })
                .error((error) => {
                    console.error(`❌ Subscribe error (${lectureChannelName}):`, error);
                });

            lectureChannel.listen('.chat.message.sent', (data) => {
                console.log('✅ Chat message sent event:', data);
                callbacksRef.current?.onChatMessageSent?.(data);
            });

            lectureChannel.listen('.question.published', (data) => {
                console.log('✅ Question published event:', data);
                callbacksRef.current?.onQuestionPublished?.(data);

                enqueueSnackbar('تم نشر سؤال جديد للطلاب', {
                    variant: 'success',
                    autoHideDuration: 3000,
                });
            });

            lectureChannel.listen('.question.closed', (data) => {
                console.log('✅ Question closed event:', data);
                callbacksRef.current?.onQuestionClosed?.(data);

                enqueueSnackbar('تم إغلاق السؤال', {
                    variant: 'info',
                    autoHideDuration: 3000,
                });
            });
        } catch (error) {
            console.error('❌ Error setting up channels:', error);
            enqueueSnackbar('خطأ في إعداد الاتصال المباشر', { variant: 'error' });
        }

        return () => {
            console.log('🧹 Cleaning up teacher real-time channels');
            cleanupChannels();
        };
    }, [lectureId, teacherId, enqueueSnackbar, cleanupChannels]); // ✅ شلنا callbacks من deps
};
