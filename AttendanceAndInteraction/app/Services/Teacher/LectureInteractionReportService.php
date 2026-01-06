<?php

namespace App\Services\Teacher;

use App\Traits\ApiResponseTrait;
use App\Models\Lecture;
use App\Models\QuestionPublication;
use App\Models\QuestionAnswer;
use Throwable;

class LectureInteractionReportService
{
    use ApiResponseTrait;

    public function report($lectureId, $teacher)
    {
        try{
            $lecture = Lecture::find($lectureId);
            if(!$lecture) return $this->unifiedResponse(false,'Lecture not found.',[],[],404);
            if((int)$lecture->instructor_id !== (int)$teacher->id) return $this->unifiedResponse(false,'Not allowed.',[],[],403);

            $pubIds = QuestionPublication::where('lecture_id',$lectureId)->pluck('id');

            $answers = QuestionAnswer::with('student:id,full_name')
                ->whereIn('publication_id',$pubIds)
                ->get();

            $byStudent = $answers->groupBy('student_id')->map(function($rows){
                return [
                    'student_id' => $rows->first()->student_id,
                    'student_name' => $rows->first()->student?->full_name,
                    'answers_count' => $rows->count(),
                    'score_total' => (int)$rows->sum('score'),
                    'correct_count' => (int)$rows->where('is_correct',true)->count(),
                ];
            })->values();

            $summary = [
                'publications_count' => (int)$pubIds->count(),
                'answers_count' => (int)$answers->count(),
                'total_score_awarded' => (int)$answers->sum('score'),
            ];

            return $this->unifiedResponse(true,'Interaction report.', [
                'summary'=>$summary,
                'by_student'=>$byStudent
            ]);
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }
}
