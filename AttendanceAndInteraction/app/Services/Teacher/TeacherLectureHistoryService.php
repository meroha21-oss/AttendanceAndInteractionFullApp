<?php

namespace App\Services\Teacher;

use App\Traits\ApiResponseTrait;
use App\Models\Lecture;
use App\Models\Enrollment;
use App\Models\Attendance;
use App\Models\QuestionPublication;
use App\Models\QuestionAnswer;
use Carbon\Carbon;
use Throwable;

class TeacherLectureHistoryService
{
    use ApiResponseTrait;

    public function index($teacher)
    {
        try {
            $lectures = Lecture::where('instructor_id', $teacher->id)
                ->where('status', 'ended') // past = ended
                ->with([
                    'course:id,code,name',
                    'section:id,name',
                ])
                ->orderByDesc('ended_at')
                ->orderByDesc('starts_at')
                ->get();

            // optional: counts
            $data = $lectures->map(function ($lec) {
                $presentCount = Attendance::where('lecture_id', $lec->id)
                    ->whereIn('status', ['present', 'late'])
                    ->count();

                $absentCount = Attendance::where('lecture_id', $lec->id)
                    ->where('status', 'absent')
                    ->count();

                $leftCount = Attendance::where('lecture_id', $lec->id)
                    ->where('status', 'left')
                    ->count();

                return [
                    'id' => $lec->id,
                    'lecture_no' => $lec->lecture_no,
                    'status' => $lec->status,
                    'scheduled_date' => $lec->scheduled_date,
                    'starts_at' => optional($lec->starts_at)->toDateTimeString(),
                    'ends_at' => optional($lec->ends_at)->toDateTimeString(),
                    'ended_at' => optional($lec->ended_at)->toDateTimeString(),
                    'course' => $lec->course,
                    'section' => $lec->section,
                    'stats' => [
                        'present_or_late' => $presentCount,
                        'absent' => $absentCount,
                        'left' => $leftCount,
                    ],
                ];
            });

            return $this->unifiedResponse(true, 'Past lectures list.', $data, [], 200);

        } catch (Throwable $e) {
            return $this->unifiedResponse(false, 'Something went wrong.', [], ['exception' => $e->getMessage()], 500);
        }
    }

    public function show(int $lectureId, $teacher)
    {
        try {
            $lecture = Lecture::where('id', $lectureId)
                ->where('instructor_id', $teacher->id)
                ->with([
                    'course:id,code,name',
                    'section:id,name',
                ])
                ->first();

            if (!$lecture) {
                return $this->unifiedResponse(false, 'Lecture not found.', [], [], 404);
            }

            if ($lecture->status !== 'ended') {
                return $this->unifiedResponse(false, 'Lecture is not ended.', [], [], 409);
            }

            // A) Students in section
            $students = Enrollment::where('section_id', $lecture->section_id)
                ->with(['student:id,full_name,email'])
                ->get()
                ->map(fn($en) => $en->student);

            // Attendance rows (may not exist for all)
            $attendanceRows = Attendance::where('lecture_id', $lecture->id)
                ->get()
                ->keyBy('student_id');

            $attendanceList = $students->map(function ($student) use ($attendanceRows) {
                $row = $attendanceRows->get($student->id);

                return [
                    'student' => [
                        'id' => $student->id,
                        'full_name' => $student->full_name,
                        'email' => $student->email,
                    ],
                    'status' => $row->status ?? 'absent',
                    'checked_in_at' => $row?->checked_in_at ? Carbon::parse($row->checked_in_at)->toDateTimeString() : null,
                    'last_seen_at' => $row?->last_seen_at ? Carbon::parse($row->last_seen_at)->toDateTimeString() : null,
                    'minutes_attended' => (int)($row->minutes_attended ?? 0),
                ];
            });

            // B) Publications + questions + options
            $publications = QuestionPublication::where('lecture_id', $lecture->id)
                ->with([
                    'question:id,lecture_id,teacher_id,type,question_text,points',
                    'question.options:id,question_id,option_text,is_correct',
                ])
                ->orderByDesc('published_at')
                ->get();

            // C) Answers summary per publication
            $pubReports = $publications->map(function ($pub) use ($students) {
                $answers = QuestionAnswer::where('publication_id', $pub->id)
                    ->with([
                        'student:id,full_name,email',
                        'selectedOption:id,option_text',
                    ])
                    ->get()
                    ->keyBy('student_id');

                $studentsReport = $students->map(function ($st) use ($answers) {
                    $ans = $answers->get($st->id);

                    return [
                        'student' => [
                            'id' => $st->id,
                            'full_name' => $st->full_name,
                            'email' => $st->email,
                        ],
                        'answered' => $ans ? true : false,
                        'selected_option' => $ans?->selectedOption ? [
                            'id' => $ans->selectedOption->id,
                            'text' => $ans->selectedOption->option_text,
                        ] : null,
                        'answer_text' => $ans?->answer_text,
                        'is_correct' => $ans?->is_correct,
                        'score' => (int)($ans?->score ?? 0),
                        'answered_at' => $ans?->answered_at ? Carbon::parse($ans->answered_at)->toDateTimeString() : null,
                    ];
                });

                $stats = [
                    'total_students' => $students->count(),
                    'answered' => $answers->count(),
                    'not_answered' => max(0, $students->count() - $answers->count()),
                    'correct' => $answers->where('is_correct', true)->count(),
                    'wrong' => $answers->where('is_correct', false)->count(),
                    'avg_score' => $answers->count() > 0 ? round($answers->avg('score'), 2) : 0,
                ];

                return [
                    'publication' => [
                        'id' => $pub->id,
                        'status' => $pub->status,
                        'published_at' => $pub->published_at ? Carbon::parse($pub->published_at)->toDateTimeString() : null,
                        'expires_at' => $pub->expires_at ? Carbon::parse($pub->expires_at)->toDateTimeString() : null,
                    ],
                    'question' => $pub->question ? [
                        'id' => $pub->question->id,
                        'type' => $pub->question->type,
                        'question_text' => $pub->question->question_text,
                        'points' => (int)$pub->question->points,
                        'options' => $pub->question->options?->map(fn($o) => [
                            'id' => $o->id,
                            'text' => $o->option_text,
                            'is_correct' => (bool)$o->is_correct,
                        ])->values(),
                    ] : null,
                    'stats' => $stats,
                    'students' => $studentsReport,
                ];
            });

            return $this->unifiedResponse(true, 'Past lecture details.', [
                'lecture' => [
                    'id' => $lecture->id,
                    'lecture_no' => $lecture->lecture_no,
                    'status' => $lecture->status,
                    'scheduled_date' => $lecture->scheduled_date,
                    'starts_at' => optional($lecture->starts_at)->toDateTimeString(),
                    'ends_at' => optional($lecture->ends_at)->toDateTimeString(),
                    'ended_at' => optional($lecture->ended_at)->toDateTimeString(),
                    'course' => $lecture->course,
                    'section' => $lecture->section,
                ],
                'attendance' => $attendanceList,
                'publications_report' => $pubReports,
            ], [], 200);

        } catch (Throwable $e) {
            return $this->unifiedResponse(false, 'Something went wrong.', [], ['exception' => $e->getMessage()], 500);
        }
    }
}
