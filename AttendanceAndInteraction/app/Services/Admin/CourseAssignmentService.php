<?php

namespace App\Services\Admin;

use App\Traits\ApiResponseTrait;
use App\Repositories\CourseAssignmentRepository;
use App\Repositories\UserRepository;
use App\Models\Lecture;
use App\Models\CourseAssignment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\UniqueConstraintViolationException;
use Throwable;

class CourseAssignmentService
{
    use ApiResponseTrait;

    public function __construct(
        protected CourseAssignmentRepository $repo,
        protected UserRepository $userRepo
    ) {}

    public function store($request)
    {
        try {
            $validated = Validator::make($request->all(), [
                'section_id' => 'required|integer|exists:sections,id',
                'course_id' => 'required|integer|exists:courses,id',
                'instructor_id' => 'required|integer|exists:users,id',

                'first_starts_at' => 'required|date',
                'duration_minutes' => 'nullable|integer|min:30|max:240',

                'total_lectures' => 'required|integer|min:1|max:100',
                'is_active' => 'sometimes|boolean',
            ])->validate();

            $teacher = $this->userRepo->findByIdAndRole($validated['instructor_id'], 'teacher');
            if (!$teacher) {
                return $this->unifiedResponse(false, 'Instructor must have teacher role.', [], [
                    'instructor_id' => ['User is not a teacher.']
                ], 422);
            }

            $duration = $validated['duration_minutes'] ?? 120;

            $first = Carbon::parse($validated['first_starts_at']);
            if (!$this->isAllowedTeachingDay($first)) {
                return $this->unifiedResponse(false, 'First lecture must be between Sunday and Thursday.', [], [
                    'first_starts_at' => ['Invalid day. Only Sunday to Thursday is allowed.']
                ], 422);
            }

            $exists = CourseAssignment::where('section_id', $validated['section_id'])
                ->where('course_id', $validated['course_id'])
                ->where('instructor_id', $validated['instructor_id'])
                ->exists();

            if ($exists) {
                return $this->unifiedResponse(false, 'This assignment already exists (section + course + instructor).', [], [
                    'section_id' => ['Duplicate assignment.'],
                    'course_id' => ['Duplicate assignment.'],
                    'instructor_id' => ['Duplicate assignment.'],
                ], 409);
            }

            $teacherConflict = $this->seriesHasTeacherConflict(
                (int)$validated['instructor_id'],
                $first,
                (int)$duration,
                (int)$validated['total_lectures']
            );

            if ($teacherConflict) {
                return $this->unifiedResponse(false, 'Schedule conflict detected for instructor within generated series.', [], [
                    'conflict' => true,
                    'type' => 'teacher'
                ], 409);
            }

            $sectionConflict = $this->seriesHasSectionConflict(
                (int)$validated['section_id'],
                $first,
                (int)$duration,
                (int)$validated['total_lectures']
            );

            if ($sectionConflict) {
                return $this->unifiedResponse(false, 'Schedule conflict detected for this section within generated series.', [], [
                    'conflict' => true,
                    'type' => 'section'
                ], 409);
            }

            $assignment = DB::transaction(function () use ($validated, $duration, $first) {
                $assignment = $this->repo->create([
                    'section_id' => $validated['section_id'],
                    'course_id' => $validated['course_id'],
                    'instructor_id' => $validated['instructor_id'],
                    'first_starts_at' => $first,
                    'duration_minutes' => $duration,
                    'total_lectures' => (int)$validated['total_lectures'],
                    'is_active' => $validated['is_active'] ?? true,
                ]);

                $this->generateLecturesForAssignment($assignment);

                return $assignment;
            });

            return $this->unifiedResponse(true, 'Course assigned and lectures generated.', [
                'assignment' => $this->repo->find($assignment->id),
            ], [], 201);

        } catch (UniqueConstraintViolationException $e) {
            return $this->unifiedResponse(false, 'Duplicate assignment (unique constraint).', [], [
                'duplicate' => true
            ], 409);

        } catch (Throwable $e) {
            return $this->unifiedResponse(false, 'Something went wrong.', [], [
                'exception' => $e->getMessage()
            ], 500);
        }
    }


    public function index()
    {
        try {
            return $this->unifiedResponse(true, 'Assignments list.', $this->repo->all(), [], 200);
        } catch (Throwable $e) {
            return $this->unifiedResponse(false, 'Something went wrong.', [], [
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    public function show(int $id)
    {
        try {
            $a = $this->repo->find($id);
            if (!$a) {
                return $this->unifiedResponse(false, 'Assignment not found.', [], [], 404);
            }
            return $this->unifiedResponse(true, 'Assignment details.', $a, [], 200);
        } catch (Throwable $e) {
            return $this->unifiedResponse(false, 'Something went wrong.', [], [
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    public function update($request, int $id)
    {
        try {
            $a = $this->repo->find($id);
            if (!$a) {
                return $this->unifiedResponse(false, 'Assignment not found.', [], [], 404);
            }

            $validated = Validator::make($request->all(), [
                'is_active' => 'required|boolean',
            ])->validate();

            $hasRunning = Lecture::where('assignment_id', $a->id)
                ->where('status', 'running')
                ->exists();

            if ($hasRunning && $validated['is_active'] === false) {
                return $this->unifiedResponse(false, 'Cannot deactivate assignment while a lecture is running.', [], [
                    'is_active' => ['Lecture is running. End it first.']
                ], 409);
            }

            $updated = $this->repo->update($a, $validated);

            return $this->unifiedResponse(true, 'Assignment updated.', $this->repo->find($updated->id), [], 200);

        } catch (Throwable $e) {
            return $this->unifiedResponse(false, 'Something went wrong.', [], [
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(int $id)
    {
        try {
            $a = $this->repo->find($id);
            if (!$a) {
                return $this->unifiedResponse(false, 'Assignment not found.', [], [], 404);
            }

            $hasNonScheduled = Lecture::where('assignment_id', $a->id)
                ->whereIn('status', ['running', 'ended'])
                ->exists();

            if ($hasNonScheduled) {
                return $this->unifiedResponse(false, 'Cannot delete assignment. Some lectures already started/ended.', [], [
                    'delete' => ['Allowed only when all lectures are scheduled.']
                ], 409);
            }

            Lecture::where('assignment_id', $a->id)->delete();

            $this->repo->delete($a);

            return $this->unifiedResponse(true, 'Assignment deleted.', [], [], 200);

        } catch (Throwable $e) {
            return $this->unifiedResponse(false, 'Something went wrong.', [], [
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    private function generateLecturesForAssignment(CourseAssignment $a): void
    {
        $startsAt = Carbon::parse($a->first_starts_at);
        $total = (int)$a->total_lectures;

        for ($i = 0; $i < $total; $i++) {
            $currentStart = $startsAt->copy()->addWeeks($i);

            if (!$this->isAllowedTeachingDay($currentStart)) {
                continue;
            }

            $currentEnd = $currentStart->copy()->addMinutes($a->duration_minutes);

            Lecture::updateOrCreate(
                [
                    'assignment_id' => $a->id,
                    'lecture_no' => $i + 1,
                ],
                [
                    'assignment_id' => $a->id,
                    'section_id' => $a->section_id,
                    'course_id' => $a->course_id,
                    'instructor_id' => $a->instructor_id,
                    'scheduled_date' => $currentStart->toDateString(),
                    'starts_at' => $currentStart,
                    'ends_at' => $currentEnd,
                    'status' => 'scheduled',
                    'lecture_no' => $i + 1,
                ]
            );
        }
    }

    private function isAllowedTeachingDay(Carbon $dt): bool
    {
        // 0=Sunday ... 6=Saturday
        // return in_array($dt->dayOfWeek, [0, 1, 2, 3, 4], true); // Sun..Thu
        return true ;
    }

    private function seriesHasTeacherConflict(int $teacherId, Carbon $firstStartsAt, int $duration, int $totalLectures): bool
    {
        for ($i = 0; $i < $totalLectures; $i++) {
            $start = $firstStartsAt->copy()->addWeeks($i);
            $end   = $start->copy()->addMinutes($duration);

            $overlap = Lecture::where('instructor_id', $teacherId)
                ->whereIn('status', ['scheduled', 'running'])
                ->where(function ($q) use ($start, $end) {
                    $q->where('starts_at', '<', $end)
                      ->where('ends_at', '>', $start);
                })
                ->exists();

            if ($overlap) return true;
        }

        return false;
    }


    private function seriesHasSectionConflict(int $sectionId, Carbon $firstStartsAt, int $duration, int $totalLectures): bool
    {
        for ($i = 0; $i < $totalLectures; $i++) {
            $start = $firstStartsAt->copy()->addWeeks($i);
            $end   = $start->copy()->addMinutes($duration);

            $overlap = Lecture::where('section_id', $sectionId)
                ->whereIn('status', ['scheduled', 'running'])
                ->where(function ($q) use ($start, $end) {
                    $q->where('starts_at', '<', $end)
                      ->where('ends_at', '>', $start);
                })
                ->exists();

            if ($overlap) return true;
        }

        return false;
    }
}


