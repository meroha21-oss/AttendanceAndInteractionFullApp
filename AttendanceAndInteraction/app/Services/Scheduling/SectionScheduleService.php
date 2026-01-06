<?php

namespace App\Services\Scheduling;

use App\Traits\ApiResponseTrait;
use App\Repositories\SectionScheduleRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Validator;

class SectionScheduleService
{
    use ApiResponseTrait;

    public function __construct(
        protected SectionScheduleRepository $repo,
        protected UserRepository $userRepo
    ) {}

    public function store($request)
    {
        $validated = Validator::make($request->all(), [
            'section_id' => 'required|integer|exists:sections,id',
            'course_id' => 'required|integer|exists:courses,id',
            'instructor_id' => 'required|integer|exists:users,id',
            'day_of_week' => 'required|integer|min:0|max:6',
            'start_time' => 'required|date_format:H:i',
            'duration_minutes' => 'nullable|integer|min:30|max:240',
            'is_active' => 'sometimes|boolean',
        ])->validate();

        $teacher = $this->userRepo->findByIdAndRole($validated['instructor_id'], 'teacher');
        if (!$teacher) return $this->unifiedResponse(false, 'Instructor must have teacher role.', [], [], 422);

        $duration = $validated['duration_minutes'] ?? 120;

        if ($this->hasConflict($validated['instructor_id'], $validated['day_of_week'], $validated['start_time'], $duration)) {
            return $this->unifiedResponse(false, 'Schedule conflict for instructor.', [], ['conflict' => true], 409);
        }

        $slot = $this->repo->create([
            ...$validated,
            'duration_minutes' => $duration,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->unifiedResponse(true, 'Schedule slot created.', $slot, [], 201);
    }

    public function index()
    {
        return $this->unifiedResponse(true, 'Schedule slots list.', $this->repo->all());
    }

    public function show(int $id)
    {
        $slot = $this->repo->find($id);
        if (!$slot) return $this->unifiedResponse(false, 'Schedule slot not found.', [], [], 404);

        return $this->unifiedResponse(true, 'Schedule slot details.', $slot);
    }

    public function update($request, int $id)
    {
        $slot = $this->repo->find($id);
        if (!$slot) return $this->unifiedResponse(false, 'Schedule slot not found.', [], [], 404);

        $validated = Validator::make($request->all(), [
            'section_id' => 'sometimes|integer|exists:sections,id',
            'course_id' => 'sometimes|integer|exists:courses,id',
            'instructor_id' => 'sometimes|integer|exists:users,id',
            'day_of_week' => 'sometimes|integer|min:0|max:6',
            'start_time' => 'sometimes|date_format:H:i',
            'duration_minutes' => 'sometimes|integer|min:30|max:240',
            'is_active' => 'sometimes|boolean',
        ])->validate();

        $newInstructor = $validated['instructor_id'] ?? $slot->instructor_id;
        $newDay = $validated['day_of_week'] ?? $slot->day_of_week;
        $newStart = $validated['start_time'] ?? $slot->start_time;
        $newDuration = $validated['duration_minutes'] ?? $slot->duration_minutes;

        $teacher = $this->userRepo->findByIdAndRole($newInstructor, 'teacher');
        if (!$teacher) return $this->unifiedResponse(false, 'Instructor must have teacher role.', [], [], 422);

        if ($this->hasConflict($newInstructor, $newDay, $newStart, $newDuration, $slot->id)) {
            return $this->unifiedResponse(false, 'Schedule conflict for instructor.', [], ['conflict' => true], 409);
        }

        $updated = $this->repo->update($slot, $validated);

        return $this->unifiedResponse(true, 'Schedule slot updated.', $updated);
    }

    public function destroy(int $id)
    {
        $slot = $this->repo->find($id);
        if (!$slot) return $this->unifiedResponse(false, 'Schedule slot not found.', [], [], 404);

        $this->repo->delete($slot);

        return $this->unifiedResponse(true, 'Schedule slot deleted.', []);
    }

    public function listBySection(int $sectionId)
    {
        return $this->unifiedResponse(true, 'Section schedule slots.', $this->repo->listBySection($sectionId));
    }

    private function hasConflict(int $instructorId, int $day, string $startTime, int $duration, ?int $ignoreId = null): bool
    {
        $existing = $this->repo->listByInstructorAndDay($instructorId, $day);

        $newStart = strtotime($startTime);
        $newEnd = $newStart + ($duration * 60);

        foreach ($existing as $slot) {
            if ($ignoreId && $slot->id == $ignoreId) continue;

            $exStart = strtotime($slot->start_time);
            $exEnd = $exStart + ($slot->duration_minutes * 60);

            if ($newStart < $exEnd && $exStart < $newEnd) return true;
        }

        return false;
    }
}
