<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\Teacher\TeacherLectureService;
use App\Services\Attendance\AttendanceService;

class TeacherLectureController extends Controller
{
    public function __construct(
        protected TeacherLectureService $teacherService,
        protected AttendanceService $attendanceService
    ) {}

    public function start($id)
    {
        return $this->teacherService->start((int)$id, request()->user());
    }

    public function end($id)
    {
        $endRes = $this->teacherService->end((int)$id, request()->user());

        $this->attendanceService->finalizeLectureAttendance((int)$id);

        return $endRes;
    }

    public function live($id)
    {
        return $this->teacherService->liveAttendance((int)$id, request()->user());
    }
}
