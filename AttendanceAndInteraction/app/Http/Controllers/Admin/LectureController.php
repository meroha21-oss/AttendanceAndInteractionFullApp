<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Scheduling\LectureGenerationService;

class LectureController extends Controller
{
    public function __construct(protected LectureGenerationService $service) {}

    public function generateNextWeek()
    {
        return $this->service->generateNextWeek();
    }
}
