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

        $rows = AttendanceHeartbeat::where('lecture_id', $lectureId)
            ->with(['student:id,full_name,email'])
            ->orderByDesc('last_seen_at')
            ->get();

        return $this->unifiedResponse(true, 'Live attendance list.', $rows);
    }
}
