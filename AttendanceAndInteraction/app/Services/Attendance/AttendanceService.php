<?php

namespace App\Services\Attendance;

use App\Traits\ApiResponseTrait;
use App\Models\Lecture;
use App\Models\Enrollment;
use App\Models\AttendanceHeartbeat;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Validator;

class AttendanceService
{
    use ApiResponseTrait;

    public function issueToken($request, $user)
    {
        $validated = Validator::make($request->all(), [
            'lecture_id' => 'required|integer|exists:lectures,id',
        ])->validate();

        $lecture = Lecture::find($validated['lecture_id']);

        $now = Carbon::now();
        if ($now->lt($lecture->starts_at) || $now->gt($lecture->ends_at)) {
            return $this->unifiedResponse(false, 'You can only attend during lecture time.', [], [], 403);
        }

        $isEnrolled = Enrollment::where('section_id', $lecture->section_id)
            ->where('student_id', $user->id)
            ->exists();

        if (!$isEnrolled) {
            return $this->unifiedResponse(false, 'You are not enrolled in this section.', [], [], 403);
        }

        $expiresAt = $now->copy()->addMinutes(10);

        $payload = [
            'lecture_id' => $lecture->id,
            'student_id' => $user->id,
            'exp' => $expiresAt->timestamp,
        ];

        $token = Crypt::encryptString(json_encode($payload));

        return $this->unifiedResponse(true, 'Attendance token issued.', [
            'token' => $token,
            'expires_at' => $expiresAt->toDateTimeString(),
        ], [], 200);
    }

    // heartbeat
    public function heartbeat($request, $user)
    {
        $validated = Validator::make($request->all(), [
            'token' => 'required|string',
        ])->validate();

        try {
            $payload = json_decode(Crypt::decryptString($validated['token']), true);
        } catch (\Throwable $e) {
            return $this->unifiedResponse(false, 'Invalid token.', [], [], 401);
        }

        if (($payload['student_id'] ?? null) !== $user->id) {
            return $this->unifiedResponse(false, 'Token does not belong to this user.', [], [], 403);
        }

        $lecture = Lecture::find($payload['lecture_id']);
        if (!$lecture) return $this->unifiedResponse(false, 'Lecture not found.', [], [], 404);

        $now = Carbon::now();

        if ($now->timestamp > ($payload['exp'] ?? 0)) {
            return $this->unifiedResponse(false, 'Token expired. Please refresh token.', [], ['expired' => true], 401);
        }

        if ($now->lt($lecture->starts_at) || $now->gt($lecture->ends_at)) {
            return $this->unifiedResponse(false, 'Lecture time ended or not started.', [], [], 403);
        }

        // Update heartbeat
        $hb = AttendanceHeartbeat::updateOrCreate(
            ['lecture_id' => $lecture->id, 'student_id' => $user->id],
            [
                'joined_at' => $now,
                'last_seen_at' => $now
            ]
        );

//         event(new \App\Events\LiveAttendanceUpdated($hb));


        Attendance::updateOrCreate(
            ['lecture_id' => $lecture->id, 'student_id' => $user->id],
            [
                'checked_in_at' => $hb->joined_at,
                'last_seen_at' => $now,
                'status' => 'present',
            ]
        );

        return $this->unifiedResponse(true, 'Heartbeat recorded.', [
            'lecture_id' => $lecture->id,
            'last_seen_at' => $now->toDateTimeString(),
        ], [], 200);
    }

    public function finalizeLectureAttendance(int $lectureId)
    {
        $lecture = Lecture::find($lectureId);
        if (!$lecture) return $this->unifiedResponse(false, 'Lecture not found.', [], [], 404);

        $students = Enrollment::where('section_id', $lecture->section_id)->pluck('student_id')->toArray();

        $lateAfterMinutes = 10;
        $inactiveAfterMinutes = 10;

        $now = Carbon::now();
        $finalized = 0;

        foreach ($students as $studentId) {
            $hb = AttendanceHeartbeat::where('lecture_id', $lecture->id)
                ->where('student_id', $studentId)
                ->first();

            if (!$hb || !$hb->joined_at) {
                Attendance::updateOrCreate(
                    ['lecture_id' => $lecture->id, 'student_id' => $studentId],
                    ['status' => 'absent']
                );
                $finalized++;
                continue;
            }

            $joinedAt = Carbon::parse($hb->joined_at);
            $lastSeen = Carbon::parse($hb->last_seen_at);

            $status = 'present';

            if ($joinedAt->gt($lecture->starts_at->copy()->addMinutes($lateAfterMinutes))) {
                $status = 'late';
            }

            if ($lastSeen->lt($now->copy()->subMinutes($inactiveAfterMinutes))) {
                $status = 'left';
            }

            $minutesAttended = max(0, $joinedAt->diffInMinutes(min($lastSeen, $lecture->ends_at)));

            Attendance::updateOrCreate(
                ['lecture_id' => $lecture->id, 'student_id' => $studentId],
                [
                    'status' => $status,
                    'checked_in_at' => $joinedAt,
                    'last_seen_at' => $lastSeen,
                    'minutes_attended' => $minutesAttended
                ]
            );

            $finalized++;
        }

        return $this->unifiedResponse(true, 'Attendance finalized.', [
            'lecture_id' => $lecture->id,
            'finalized_students' => $finalized
        ], [], 200);
    }
}
