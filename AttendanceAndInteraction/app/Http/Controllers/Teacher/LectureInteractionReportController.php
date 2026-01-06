<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LectureInteractionReportController extends Controller
{
    public function __construct(protected \App\Services\Teacher\LectureInteractionReportService $service){}

    public function show($lectureId, Request $request){
        return $this->service->report((int)$lectureId, $request->user());
    }
}

