<?php

namespace App\Repositories;

use App\Models\SectionSchedule;

class SectionScheduleRepository
{
    public function create(array $data): SectionSchedule
    {
        return SectionSchedule::create($data);
    }

    public function all()
    {
        return SectionSchedule::with(['section','course','instructor'])
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();
    }

    public function find(int $id): ?SectionSchedule
    {
        return SectionSchedule::with(['section','course','instructor'])->find($id);
    }

    public function update(SectionSchedule $slot, array $data): SectionSchedule
    {
        $slot->update($data);
        return $slot;
    }

    public function delete(SectionSchedule $slot): void
    {
        $slot->delete();
    }

    public function listBySection(int $sectionId)
    {
        return SectionSchedule::with(['course','instructor'])
            ->where('section_id', $sectionId)
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();
    }

    public function listByInstructorAndDay(int $instructorId, int $dayOfWeek)
    {
        return SectionSchedule::where('instructor_id', $instructorId)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->get();
    }
}
