<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LectureQuestionAnswerController extends Controller
{
    public function __construct(protected \App\Services\Student\LectureQuestionAnswerService $service){}

    public function active($lectureId, Request $request){ return $this->service->activePublications((int)$lectureId, $request->user()); }
    public function answer(Request $request){ return $this->service->answer($request, $request->user()); }
}
