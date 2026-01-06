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
}

