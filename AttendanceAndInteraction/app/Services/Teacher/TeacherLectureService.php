<?php

namespace App\Services\Teacher;

use App\Traits\ApiResponseTrait;
use App\Models\Lecture;
use App\Models\AttendanceHeartbeat;
use App\Services\Attendance\AttendanceService;
use Carbon\Carbon;

class TeacherLectureService
{
    use ApiResponseTrait;

    public function __construct(
        protected AttendanceService $attendanceService
    ) {}

    public function start(int $lectureId, $teacher)
    {
        $lecture = Lecture::find($lectureId);
        if (!$lecture) return $this->unifiedResponse(false, 'Lecture not found.', [], [], 404);

        if ($lecture->instructor_id !== $teacher->id) {
            return $this->unifiedResponse(false, 'Not allowed.', [], [], 403);
        }

        if (in_array($lecture->status, ['ended','cancelled'], true)) {
            return $this->unifiedResponse(false, 'Lecture cannot be started.', [], [], 409);
        }

        $now = Carbon::now();

        if ($now->lt($lecture->starts_at)) {
            return $this->unifiedResponse(false, 'Too early to start lecture.', [], [
                'starts_at' => [$lecture->starts_at->toDateTimeString()]
            ], 409);
        }

        if ($now->gt($lecture->ends_at)) {
            $lecture->status = 'cancelled';
            $lecture->save();

            return $this->unifiedResponse(false, 'Lecture time passed. Lecture cancelled.', $lecture, [], 409);
        }

        // scheduled => running
        $lecture->status = 'running';
        $lecture->save();

        return $this->unifiedResponse(true, 'Lecture started.', $lecture);
    }

    public function end(int $lectureId, $teacher)
    {
        $lecture = Lecture::find($lectureId);
        if (!$lecture) return $this->unifiedResponse(false, 'Lecture not found.', [], [], 404);

        if ($lecture->instructor_id !== $teacher->id) {
            return $this->unifiedResponse(false, 'Not allowed.', [], [], 403);
        }

        if ($lecture->status !== 'running') {
            return $this->unifiedResponse(false, 'Lecture is not running.', [], [], 409);
        }

        $lecture->status = 'ended';
        $lecture->ended_at = Carbon::now();
        $lecture->save();

        // Finalize attendance now (so past reports are accurate)
        $this->attendanceService->finalizeLectureAttendance($lecture->id);

        return $this->unifiedResponse(true, 'Lecture ended.', $lecture);
    }

    // Live list

    public function liveAttendance(int $lectureId, $teacher)
    {
        $lecture = Lecture::find($lectureId);
        if (!$lecture) return $this->unifiedResponse(false, 'Lecture not found.', [], [], 404);

        if ($lecture->instructor_id !== $teacher->id) {
            return $this->unifiedResponse(false, 'Not allowed.', [], [], 403);
        }

        $enrollments = \App\Models\Enrollment::where('section_id', $lecture->section_id)
            ->with(['student:id,full_name,email'])
            ->get();

        $studentIds = $enrollments->pluck('student_id')->toArray();

        $attendances = \App\Models\Attendance::where('lecture_id', $lecture->id)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->keyBy('student_id');

        $heartbeats = \App\Models\AttendanceHeartbeat::where('lecture_id', $lecture->id)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->keyBy('student_id');

        $lateAfterMinutes = 10;
        $inactiveAfterMinutes = 10;
        $now = Carbon::now();

        $rows = $enrollments->map(function ($en) use ($attendances, $heartbeats, $lecture, $now, $lateAfterMinutes, $inactiveAfterMinutes) {
            $student = $en->student;

            $att = $attendances->get($student->id);
            $hb  = $heartbeats->get($student->id);

            $status = $att->status ?? 'absent';
            $checkedInAt = $att->checked_in_at ?? null;
            $lastSeenAt  = $att->last_seen_at ?? null;
            $minutesAttended = (int)($att->minutes_attended ?? 0);

            if ($hb && $hb->joined_at) {
                $joinedAt = Carbon::parse($hb->joined_at);
                $lastSeen = $hb->last_seen_at ? Carbon::parse($hb->last_seen_at) : $joinedAt;

                $checkedInAt = $checkedInAt ?? $joinedAt;
                $lastSeenAt = $lastSeen;

                $status = 'present';

                if ($joinedAt->gt($lecture->starts_at->copy()->addMinutes($lateAfterMinutes))) {
                    $status = 'late';
                }

                if ($lastSeen->lt($now->copy()->subMinutes($inactiveAfterMinutes))) {
                    $status = 'left';
                }

                $minutesAttended = max(0, $joinedAt->diffInMinutes(min($lastSeen, $lecture->ends_at)));
            }

            return [
                'student' => [
                    'id' => $student->id,
                    'full_name' => $student->full_name,
                    'email' => $student->email,
                ],
                'status' => $status,
                'checked_in_at' => $checkedInAt ? Carbon::parse($checkedInAt)->toDateTimeString() : null,
                'last_seen_at' => $lastSeenAt ? Carbon::parse($lastSeenAt)->toDateTimeString() : null,
                'minutes_attended' => $minutesAttended,
            ];
        });

        $order = ['present' => 1, 'late' => 2, 'left' => 3, 'absent' => 4];
        $rows = $rows->sortBy(fn($r) => $order[$r['status']] ?? 99)->values();

        return $this->unifiedResponse(true, 'Live attendance list (all section students).', $rows, [], 200);
    }

    // public function liveAttendance(int $lectureId, $teacher)
    // {
    //     $lecture = Lecture::find($lectureId);
    //     if (!$lecture) return $this->unifiedResponse(false, 'Lecture not found.', [], [], 404);

    //     if ($lecture->instructor_id !== $teacher->id) {
    //         return $this->unifiedResponse(false, 'Not allowed.', [], [], 403);
    //     }

    //     $rows = AttendanceHeartbeat::where('lecture_id', $lectureId)
    //         ->with(['student:id,full_name,email'])
    //         ->orderByDesc('last_seen_at')
    //         ->get();

    //     return $this->unifiedResponse(true, 'Live attendance list.', $rows);
    // }
}
