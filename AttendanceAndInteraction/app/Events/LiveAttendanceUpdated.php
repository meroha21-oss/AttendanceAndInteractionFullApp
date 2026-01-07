<?php

namespace App\Events;

use App\Models\AttendanceHeartbeat;
use App\Models\Lecture;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class LiveAttendanceUpdated implements ShouldBroadcast
{
    use SerializesModels;

    public int $teacherId;

    public function __construct(public AttendanceHeartbeat $heartbeat)
    {
        $this->heartbeat->loadMissing('student:id,full_name,email');

        $lecture = Lecture::select('id','instructor_id')->find($this->heartbeat->lecture_id);
        $this->teacherId = (int)($lecture?->instructor_id ?? 0);
    }

    public function broadcastOn(): array
    {
        return [new Channel('teacher.' . $this->teacherId)];
    }

    public function broadcastAs(): string
    {
        return 'attendance.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'lecture_id' => $this->heartbeat->lecture_id,
            'student' => [
                'id' => $this->heartbeat->student_id,
                'full_name' => $this->heartbeat->student?->full_name,
                'email' => $this->heartbeat->student?->email,
            ],
            'joined_at' => optional($this->heartbeat->joined_at)->toDateTimeString(),
            'last_seen_at' => optional($this->heartbeat->last_seen_at)->toDateTimeString(),
        ];
    }
}
