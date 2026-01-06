<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LectureChatController extends Controller
{
    public function __construct(protected \App\Services\Common\LectureChatService $service){}

    public function index($lectureId, Request $request){ return $this->service->list((int)$lectureId, $request->user()); }
    public function send($lectureId, Request $request){ return $this->service->send($request, (int)$lectureId, $request->user()); }
}

