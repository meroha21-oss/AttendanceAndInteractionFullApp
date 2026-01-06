<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Lecture;
use App\Models\Enrollment;

/**
 * قناة المحاضرة (للشات + نشر سؤال/إغلاقه)
 * private-lecture.{lectureId}
 */
Broadcast::channel('lecture.{lectureId}', function ($user, $lectureId) {
    $lecture = Lecture::find($lectureId);
    if (!$lecture) return false;

    // المدرس صاحب المحاضرة
    if ($user->role === 'teacher' && (int)$lecture->instructor_id === (int)$user->id) {
        return ['id' => $user->id, 'full_name' => $user->full_name, 'role' => $user->role];
    }

    // الطالب المسجل بالشعبة
    if ($user->role === 'student') {
        $enrolled = Enrollment::where('student_id', $user->id)
            ->where('section_id', $lecture->section_id)
            ->exists();

        if ($enrolled) {
            return ['id' => $user->id, 'full_name' => $user->full_name, 'role' => $user->role];
        }
    }

    return false;
});

/**
 * قناة خاصة للمدرس (لإجابات الطلاب + live attendance updates)
 * private-teacher.{teacherId}
 */
Broadcast::channel('teacher.{teacherId}', function ($user, $teacherId) {
    if ($user->role !== 'teacher') return false;
    return (int)$user->id === (int)$teacherId
        ? ['id' => $user->id, 'full_name' => $user->full_name, 'role' => $user->role]
        : false;
});
