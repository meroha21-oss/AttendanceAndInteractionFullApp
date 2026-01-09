<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Teacher\TeacherLectureHistoryService;

class TeacherLectureHistoryController extends Controller
{
    public function __construct(
        protected TeacherLectureHistoryService $service
    ) {}

    public function index(Request $request)
    {
        return $this->service->index($request->user());
    }

    public function show(int $lectureId, Request $request)
    {
        return $this->service->show($lectureId, $request->user());
    }
}
