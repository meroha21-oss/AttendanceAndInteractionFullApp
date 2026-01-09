<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\Attendance\AttendanceService;
use Illuminate\Http\Request;

class StudentAttendanceController extends Controller
{
    public function __construct(protected AttendanceService $service) {}

    public function token(Request $request)
    {
        return $this->service->issueToken($request, $request->user());
    }

    public function heartbeat(Request $request)
    {
        return $this->service->heartbeat($request, $request->user());
    }

    public function leave(int $lectureId, Request $request)
    {
        $user = $request->user();
        return $this->service->leaveLecture($lectureId, $user);
    }

}
