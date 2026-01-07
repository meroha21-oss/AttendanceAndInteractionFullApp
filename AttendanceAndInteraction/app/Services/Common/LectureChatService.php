<?php

namespace App\Services\Common;

use App\Traits\ApiResponseTrait;
use App\Repositories\LectureChatRepository;
use App\Models\Lecture;
use App\Models\Enrollment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Throwable;

class LectureChatService
{
    use ApiResponseTrait;

    public function __construct(protected LectureChatRepository $repo){}

    public function list($lectureId, $user)
    {
        try{
            $lecture = Lecture::find($lectureId);
            if(!$lecture) return $this->unifiedResponse(false,'Lecture not found.',[],[],404);

            if($user->role === 'teacher' && (int)$lecture->instructor_id !== (int)$user->id){
                return $this->unifiedResponse(false,'Not allowed.',[],[],403);
            }
            if($user->role === 'student'){
                $enrolled = Enrollment::where('student_id',$user->id)->where('section_id',$lecture->section_id)->exists();
                if(!$enrolled) return $this->unifiedResponse(false,'Not enrolled.',[],[],403);
            }

            return $this->unifiedResponse(true,'Chat messages.', $this->repo->list($lectureId, 50));
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }

    public function send($request, $lectureId, $user)
    {
        try{
            $v = Validator::make($request->all(),[
                'message' => 'required|string|min:1|max:2000'
            ])->validate();

            $lecture = Lecture::find($lectureId);
            if(!$lecture) return $this->unifiedResponse(false,'Lecture not found.',[],[],404);

            if($user->role === 'teacher' && (int)$lecture->instructor_id !== (int)$user->id){
                return $this->unifiedResponse(false,'Not allowed.',[],[],403);
            }
            if($user->role === 'student'){
                $enrolled = Enrollment::where('student_id',$user->id)->where('section_id',$lecture->section_id)->exists();
                if(!$enrolled) return $this->unifiedResponse(false,'Not enrolled.',[],[],403);
            }

            $msg = $this->repo->create([
                'lecture_id'=>$lectureId,
                'user_id'=>$user->id,
                'message'=>$v['message'],
                'sent_at'=>Carbon::now(),
            ]);
            $msg->load('user:id,full_name,role');

            event(new \App\Events\ChatMessageSent($msg));

            return $this->unifiedResponse(true,'Message sent.', $msg, [], 201);
        }catch(Throwable $e){
            return $this->unifiedResponse(false,'Something went wrong.',[],['exception'=>$e->getMessage()],500);
        }
    }
}
