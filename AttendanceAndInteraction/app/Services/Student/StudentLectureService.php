<?php

namespace App\Services\Student;

use App\Traits\ApiResponseTrait;
use App\Models\Lecture;
use App\Models\Enrollment;
use Carbon\Carbon;

class StudentLectureService
{
    use ApiResponseTrait;

    public function week($student)
    {
        $start = Carbon::now()->startOfWeek(Carbon::SUNDAY);
        $end   = $start->copy()->addDays(4);

        $sectionIds = Enrollment::where('student_id', $student->id)
            ->pluck('section_id');

        $lectures = Lecture::with(['course','section','instructor'])
            ->whereIn('section_id', $sectionIds)
            ->whereBetween('scheduled_date', [$start->toDateString(), $end->toDateString()])
            ->orderBy('starts_at')
            ->get();

        return $this->unifiedResponse(true, 'Student week lectures.', $lectures);
    }

    public function today($student)
    {
        $today = Carbon::today()->toDateString();

        $sectionIds = Enrollment::where('student_id', $student->id)
            ->pluck('section_id');

        $lectures = Lecture::with(['course','section','instructor'])
            ->whereIn('section_id', $sectionIds)
            ->where('scheduled_date', $today)
            ->orderBy('starts_at')
            ->get();

        return $this->unifiedResponse(true, 'Student today lectures.', $lectures);
    }
}
