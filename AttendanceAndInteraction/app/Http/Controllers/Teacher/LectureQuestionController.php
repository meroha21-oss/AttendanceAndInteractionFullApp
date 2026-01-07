<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LectureQuestionController extends Controller
{
    public function __construct(protected \App\Services\Teacher\LectureQuestionService $service){}

    public function store(Request $request){ return $this->service->createQuestion($request, $request->user()); }
    public function index($lectureId, Request $request){ return $this->service->listQuestions((int)$lectureId, $request->user()); }
    public function publish(Request $request){ return $this->service->publish($request, $request->user()); }
    public function close($publicationId, Request $request){ return $this->service->closePublication((int)$publicationId, $request->user()); }

    public function showQuestion($lectureId, $questionId, Request $request){
        return $this->service->showQuestion((int)$lectureId, (int)$questionId, $request->user());
    }


    public function publicationsIndex($lectureId, Request $request){
        $status = $request->query('status'); // null|published|closed
        return $this->service->listPublications((int)$lectureId, $request->user(), $status);
    }

    public function publicationShow($lectureId, $publicationId, Request $request){
        return $this->service->showPublication((int)$lectureId, (int)$publicationId, $request->user());
    }
}

