<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\Teacher\TeacherLectureScheduleService;

class TeacherLectureScheduleController extends Controller
{
    public function __construct(protected TeacherLectureScheduleService $service) {}

    public function week()
    {
        return $this->service->week(request()->user());
    }

    public function today()
    {
        return $this->service->today(request()->user());
    }
}
