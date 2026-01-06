<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\Student\StudentLectureService;

class StudentLectureController extends Controller
{
    public function __construct(protected StudentLectureService $service) {}

    public function week()
    {
        return $this->service->week(request()->user());
    }

    public function today()
    {
        return $this->service->today(request()->user());
    }
}
