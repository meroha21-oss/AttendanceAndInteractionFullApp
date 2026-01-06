<?php

namespace App\Services\Scheduling;

use App\Traits\ApiResponseTrait;
use App\Models\SectionSchedule;
use App\Repositories\LectureRepository;
use Carbon\Carbon;

class LectureGenerationService
{
    use ApiResponseTrait;

    public function __construct(protected LectureRepository $lectureRepo) {}

    public function generateNextWeek()
    {
        $today = Carbon::today();
        $startOfNextWeek = $today->copy()->startOfWeek(Carbon::SUNDAY)->addWeek();
        $endOfNextWeek   = $startOfNextWeek->copy()->addDays(4); // Sun..Thu فقط

        $schedules = SectionSchedule::where('is_active', true)->get();

        $generated = 0;

        foreach ($schedules as $slot) {
            $lectureDate = $startOfNextWeek->copy()->addDays($slot->day_of_week);

            if ($lectureDate->lt($startOfNextWeek) || $lectureDate->gt($endOfNextWeek)) {
                continue;
            }

            $startsAt = Carbon::parse($lectureDate->toDateString() . ' ' . $slot->start_time);
            $endsAt   = $startsAt->copy()->addMinutes($slot->duration_minutes);

            $unique = [
                'section_id'     => $slot->section_id,
                'course_id'      => $slot->course_id,
                'scheduled_date' => $lectureDate->toDateString(),
                'starts_at'      => $startsAt->toDateTimeString(),
            ];

            $data = [
                'section_id'     => $slot->section_id,
                'course_id'      => $slot->course_id,
                'instructor_id'  => $slot->instructor_id,
                'scheduled_date' => $lectureDate->toDateString(),
                'starts_at'      => $startsAt->toDateTimeString(),
                'ends_at'        => $endsAt->toDateTimeString(),
                'status'         => 'scheduled',
            ];

            $this->lectureRepo->upsert($unique, $data);
            $generated++;
        }

        return $this->unifiedResponse(true, 'Next week lectures generated.', [
            'generated_rows' => $generated,
            'week_start' => $startOfNextWeek->toDateString(),
            'week_end'   => $endOfNextWeek->toDateString(),
        ], [], 200);
    }
}
