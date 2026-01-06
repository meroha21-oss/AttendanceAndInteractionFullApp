<?php

namespace App\Services\Teacher;

use App\Traits\ApiResponseTrait;
use App\Models\Lecture;
use Carbon\Carbon;

class TeacherLectureScheduleService
{
    use ApiResponseTrait;

    public function week($teacher)
    {
        $start = Carbon::now()->startOfWeek(Carbon::SUNDAY);
        $end   = $start->copy()->addDays(4);

        $lectures = Lecture::with(['course','section'])
            ->where('instructor_id', $teacher->id)
            ->whereBetween('scheduled_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('starts_at')
            ->get();

        return $this->unifiedResponse(true, 'Teacher week lectures.', $lectures);
    }

    public function today($teacher)
    {
        $today = Carbon::today()->toDateString();

        $lectures = Lecture::with(['course','section'])
            ->where('instructor_id', $teacher->id)
            ->where('scheduled_date', $today)
            ->orderBy('starts_at')
            ->get();

        return $this->unifiedResponse(true, 'Teacher today lectures.', $lectures);
    }
}
