<?php

namespace App\Services\Student;

use App\Traits\ApiResponseTrait;
use App\Repositories\QuestionPublicationRepository;
use App\Repositories\QuestionAnswerRepository;
use App\Models\Enrollment;
use App\Models\Lecture;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Throwable;

class LectureQuestionAnswerService
{
    use ApiResponseTrait;

    public function __construct(
        protected QuestionPublicationRepository $pRepo,
        protected QuestionAnswerRepository $aRepo
    ){}

    public function activePublications($lectureId, $student)
    {
        try{
            $lecture = Lecture::find($lectureId);
            if(!$lecture) return $this->unifiedResponse(false,'Lecture not found.',[],[],404);

            // لازم المحاضرة running
            if($lecture->status !== 'running'){
                return $this->unifiedResponse(false,'Lecture is not running.',[],[],403);
            }

            // لازم enrolled
            $enrolled = Enrollment::where('student_id',$student->id)
                ->where('section_id',$lecture->section_id)
                ->exists();

            if(!$enrolled){
                return $this->unifiedResponse(false,'Not enrolled in this lecture section.',[],[],403);
            }

            // لازم حاضر فعلياً
            $att = Attendance::where('lecture_id',$lectureId)
                ->where('student_id',$student->id)
                ->first();

            if(!$att || in_array($att->status,['absent'],true)){
                return $this->unifiedResponse(false,'You must be attending the lecture to view questions.',[],[],403);
            }

            // (اختياري) كمان نطلب آخر ظهور قريب
            // $inactiveAfter = 10;
            // if($att->last_seen_at && Carbon::parse($att->last_seen_at)->lt(now()->subMinutes($inactiveAfter))){
            //     return $this->unifiedResponse(false,'You are not active in the lecture.',[],[],403);
            // }

            $pubs = \App\Models\QuestionPublication::with('question.options')
                ->where('lecture_id',$lectureId)
                ->where('status','published')
                ->orderByDesc('id')
                ->get();

            return $this->unifiedResponse(true,'Active questions.', $pubs);
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }

    // public function activePublications($lectureId, $student)
    // {
    //     try{
    //         $pubs = \App\Models\QuestionPublication::with('question.options')
    //             ->where('lecture_id',$lectureId)
    //             ->where('status','published')
    //             ->orderByDesc('id')
    //             ->get();

    //         return $this->unifiedResponse(true,'Active questions.', $pubs);
    //     }catch(Throwable $e){
    //         return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
    //     }
    // }

    public function answer($request, $student)
    {
        try{
            $v = Validator::make($request->all(),[
                'publication_id' => 'required|integer|exists:question_publications,id',
                'selected_option_id' => 'nullable|integer|exists:question_options,id',
                'answer_text' => 'nullable|string|max:2000',
            ])->validate();

            $pub = $this->pRepo->find($v['publication_id']);
            if(!$pub) return $this->unifiedResponse(false,'Publication not found.',[],[],404);

            $now = Carbon::now();
            if($pub->status !== 'published'){
                return $this->unifiedResponse(false,'Question is not active.',[],[],409);
            }
            if($pub->expires_at && $now->gt($pub->expires_at)){
                return $this->unifiedResponse(false,'Question expired.',[],[],409);
            }

            $lecture = $pub->lecture;
            $enrolled = Enrollment::where('student_id',$student->id)->where('section_id',$lecture->section_id)->exists();
            if(!$enrolled){
                return $this->unifiedResponse(false,'Not enrolled in this lecture section.',[],[],403);
            }

            $q = $pub->question;

            $lecture = $pub->lecture;

            if($lecture->status !== 'running'){
                return $this->unifiedResponse(false,'Lecture is not running.',[],[],403);
            }

            $att = \App\Models\Attendance::where('lecture_id',$lecture->id)
                ->where('student_id',$student->id)
                ->first();

            if(!$att || $att->status === 'absent'){
                return $this->unifiedResponse(false,'You must be attending the lecture to answer.',[],[],403);
            }


            // validate per type
            if(in_array($q->type,['mcq','true_false'], true)){
                if(empty($v['selected_option_id'])){
                    return $this->unifiedResponse(false,'selected_option_id is required.',[],[
                        'selected_option_id'=>['Required for mcq/true_false']
                    ],422);
                }
            }else{ // short
                if(empty($v['answer_text'])){
                    return $this->unifiedResponse(false,'answer_text is required.',[],[
                        'answer_text'=>['Required for short answer']
                    ],422);
                }
            }

            // scoring for mcq/true_false (auto)
            $isCorrect = null; $score = 0;
            if(in_array($q->type,['mcq','true_false'], true)){
                $opt = $q->options()->where('id',$v['selected_option_id'])->first();
                if(!$opt){
                    return $this->unifiedResponse(false,'Invalid option for this question.',[],[],422);
                }
                $isCorrect = (bool)$opt->is_correct;
                $score = $isCorrect ? (int)$q->points : 0;
            }

            $answer = $this->aRepo->upsertAnswer(
                ['publication_id'=>$pub->id, 'student_id'=>$student->id],
                [
                    'question_id'=>$q->id,
                    'selected_option_id'=>$v['selected_option_id'] ?? null,
                    'answer_text'=>$v['answer_text'] ?? null,
                    'is_correct'=>$isCorrect,
                    'score'=>$score,
                    'answered_at'=>$now,
                ]
            );

            event(new \App\Events\AnswerSubmitted($answer));


            return $this->unifiedResponse(true,'Answer saved.', $answer);
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }
}
