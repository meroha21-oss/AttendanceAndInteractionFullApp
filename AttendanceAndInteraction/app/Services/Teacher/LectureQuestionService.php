<?php

namespace App\Services\Teacher;

use App\Traits\ApiResponseTrait;
use App\Repositories\LectureQuestionRepository;
use App\Repositories\QuestionPublicationRepository;
use App\Models\Lecture;
use App\Models\QuestionOption;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Throwable;

class LectureQuestionService
{
    use ApiResponseTrait;

    public function __construct(
        protected LectureQuestionRepository $qRepo,
        protected QuestionPublicationRepository $pRepo
    ){}

    public function createQuestion($request, $teacher)
    {
        try{
            $v = Validator::make($request->all(),[
                'lecture_id' => 'required|integer|exists:lectures,id',
                'type' => 'required|in:mcq,true_false,short',
                'question_text' => 'required|string|min:3',
                'points' => 'nullable|integer|min:1|max:100',
                // للـ MCQ
                'options' => 'nullable|array|min:2|max:6',
                'options.*.text' => 'required_with:options|string|min:1',
                'correct_index' => 'nullable|integer|min:0|max:10',
            ])->validate();

            $lecture = Lecture::find($v['lecture_id']);
            if(!$lecture) return $this->unifiedResponse(false,'Lecture not found.',[],[],404);
            if((int)$lecture->instructor_id !== (int)$teacher->id){
                return $this->unifiedResponse(false,'Not allowed.',[],[],403);
            }

            $q = $this->qRepo->create([
                'lecture_id' => $lecture->id,
                'teacher_id' => $teacher->id,
                'type' => $v['type'],
                'question_text' => $v['question_text'],
                'points' => $v['points'] ?? 1,
                'is_active' => true,
            ]);

            // options
            if(in_array($v['type'],['mcq','true_false'], true)){
                $options = $v['options'] ?? null;

                if($v['type']==='true_false'){
                    $options = [
                        ['text'=>'True'],
                        ['text'=>'False'],
                    ];
                    // correct_index لازم يجي 0 أو 1
                }

                if(!$options){
                    return $this->unifiedResponse(false,'Options are required for mcq/true_false.',[],[
                        'options'=>['Options are required.']
                    ],422);
                }

                $correctIndex = $v['correct_index'] ?? null;
                if($correctIndex === null || $correctIndex < 0 || $correctIndex >= count($options)){
                    return $this->unifiedResponse(false,'correct_index is invalid.',[],[
                        'correct_index'=>['Must point to a valid option index.']
                    ],422);
                }

                foreach($options as $idx => $opt){
                    QuestionOption::create([
                        'question_id' => $q->id,
                        'option_text' => $opt['text'],
                        'is_correct' => ($idx === (int)$correctIndex),
                    ]);
                }
            }

            return $this->unifiedResponse(true,'Question created.', $this->qRepo->find($q->id), [], 201);
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }

    public function listQuestions($lectureId, $teacher)
    {
        try{
            $lecture = Lecture::find($lectureId);
            if(!$lecture) return $this->unifiedResponse(false,'Lecture not found.',[],[],404);
            if((int)$lecture->instructor_id !== (int)$teacher->id) return $this->unifiedResponse(false,'Not allowed.',[],[],403);

            return $this->unifiedResponse(true,'Questions list.', $this->qRepo->listByLecture($lectureId));
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }

    // Publish question: creates publication and opens it
    public function publish($request, $teacher)
    {
        try{
            $v = Validator::make($request->all(),[
                'question_id' => 'required|integer|exists:lecture_questions,id',
                'expires_in_seconds' => 'nullable|integer|min:10|max:3600'
            ])->validate();

            $q = $this->qRepo->find($v['question_id']);
            if(!$q) return $this->unifiedResponse(false,'Question not found.',[],[],404);

            $lecture = $q->lecture;
            if((int)$lecture->instructor_id !== (int)$teacher->id) return $this->unifiedResponse(false,'Not allowed.',[],[],403);

            // lecture must be running (MVP: enforce)
            if(($lecture->status ?? '') !== 'running'){
                return $this->unifiedResponse(false,'Lecture is not running.',[],[
                    'status'=>['Start lecture first.']
                ],409);
            }

            $now = Carbon::now();
            $expires = isset($v['expires_in_seconds'])
                ? $now->copy()->addSeconds((int)$v['expires_in_seconds'])
                : $now->copy()->addMinutes(5);

            $pub = $this->pRepo->create([
                'question_id' => $q->id,
                'lecture_id' => $lecture->id,
                'published_at' => $now,
                'expires_at' => $expires,
                'status' => 'published',
            ]);

            event(new \App\Events\QuestionPublished($pub));


            return $this->unifiedResponse(true,'Question published.', $this->pRepo->find($pub->id), [], 201);
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }

    public function closePublication($publicationId, $teacher)
    {
        try{
            $pub = $this->pRepo->find($publicationId);
            if(!$pub) return $this->unifiedResponse(false,'Publication not found.',[],[],404);

            $lecture = $pub->lecture;
            if((int)$lecture->instructor_id !== (int)$teacher->id) return $this->unifiedResponse(false,'Not allowed.',[],[],403);

            $pub->status = 'closed';
            $pub->save();

            event(new \App\Events\QuestionClosed($pub));


            return $this->unifiedResponse(true,'Publication closed.', $this->pRepo->find($pub->id));
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }


    public function showQuestion(int $lectureId, int $questionId, $teacher)
    {
        try{
            $lecture = Lecture::find($lectureId);
            if(!$lecture) return $this->unifiedResponse(false,'Lecture not found.',[],[],404);
            if((int)$lecture->instructor_id !== (int)$teacher->id) return $this->unifiedResponse(false,'Not allowed.',[],[],403);

            $q = $this->qRepo->findByLecture($lectureId, $questionId);
            if(!$q) return $this->unifiedResponse(false,'Question not found for this lecture.',[],[],404);

            return $this->unifiedResponse(true,'Question details.', $q);
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }


    public function listPublications(int $lectureId, $teacher, ?string $status = null)
    {
        try{
            $lecture = Lecture::find($lectureId);
            if(!$lecture) return $this->unifiedResponse(false,'Lecture not found.',[],[],404);
            if((int)$lecture->instructor_id !== (int)$teacher->id) return $this->unifiedResponse(false,'Not allowed.',[],[],403);

            $pubs = $this->pRepo->listByLecture($lectureId, $status);

            $now = Carbon::now();
            $data = $pubs->map(function($pub) use ($now){
                return $this->formatPublicationWithTime($pub, $now);
            })->values();

            return $this->unifiedResponse(true,'Publications list.', $data);
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }

    public function showPublication(int $lectureId, int $publicationId, $teacher)
    {
        try{
            $lecture = Lecture::find($lectureId);
            if(!$lecture) return $this->unifiedResponse(false,'Lecture not found.',[],[],404);
            if((int)$lecture->instructor_id !== (int)$teacher->id) return $this->unifiedResponse(false,'Not allowed.',[],[],403);

            $pub = $this->pRepo->findByLecture($lectureId, $publicationId);
            if(!$pub) return $this->unifiedResponse(false,'Publication not found for this lecture.',[],[],404);

            $now = Carbon::now();
            $data = $this->formatPublicationWithTime($pub, $now, true);

            return $this->unifiedResponse(true,'Publication details.', $data);
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }

    private function formatPublicationWithTime($pub, Carbon $now, bool $includeAnswers = false): array
    {
        $expiresAt = $pub->expires_at ? Carbon::parse($pub->expires_at) : null;

        $isExpired = $expiresAt ? $now->greaterThan($expiresAt) : false;
        $timeLeftSeconds = $expiresAt ? max(0, $now->diffInSeconds($expiresAt, false)) : null;

        $base = [
            'publication' => [
                'id' => $pub->id,
                'lecture_id' => $pub->lecture_id,
                'status' => $pub->status,
                'published_at' => optional($pub->published_at)->toDateTimeString(),
                'expires_at' => optional($pub->expires_at)->toDateTimeString(),
                'is_expired' => $isExpired,
                'time_left_seconds' => $timeLeftSeconds,
            ],
            'question' => [
                'id' => $pub->question?->id,
                'type' => $pub->question?->type,
                'question_text' => $pub->question?->question_text,
                'points' => $pub->question?->points,
                'options' => $pub->question?->options?->map(fn($o)=>[
                    'id' => $o->id,
                    'text' => $o->option_text,
                ])->values() ?? [],
            ],
        ];

        if($includeAnswers){
            $base['answers'] = $pub->answers?->map(function($a){
                return [
                    'id' => $a->id,
                    'student' => [
                        'id' => $a->student_id,
                        'full_name' => $a->student?->full_name,
                    ],
                    'selected_option_id' => $a->selected_option_id,
                    'answer_text' => $a->answer_text,
                    'is_correct' => $a->is_correct,
                    'score' => $a->score,
                    'answered_at' => optional($a->answered_at)->toDateTimeString(),
                ];
            })->values() ?? [];
        }

        return $base;
    }
}
