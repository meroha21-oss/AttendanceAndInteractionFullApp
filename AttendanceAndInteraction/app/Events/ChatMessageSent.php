<?php

namespace App\Events;

use App\Models\LectureChatMessage;
// use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ChatMessageSent implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(public LectureChatMessage $message) {}

    public function broadcastOn(): array
    {
        return [new Channel('lecture.' . $this->message->lecture_id)];
    }

    public function broadcastAs(): string
    {
        return 'chat.message.sent';
    }

    public function broadcastWith(): array
    {
        $this->message->loadMissing('user:id,full_name,role');

        return [
            'message' => [
                'id' => $this->message->id,
                'lecture_id' => $this->message->lecture_id,
                'message' => $this->message->message,
                'sent_at' => optional($this->message->sent_at)->toDateTimeString(),
                'user' => [
                    'id' => $this->message->user->id,
                    'full_name' => $this->message->user->full_name,
                    'role' => $this->message->user->role,
                ],
            ],
        ];
    }
}
