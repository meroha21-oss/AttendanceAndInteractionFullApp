<?php

namespace App\Events;

use App\Models\QuestionPublication;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class QuestionClosed implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(public QuestionPublication $publication) {}

    public function broadcastOn(): array
    {
        return [new Channel('lecture.' . $this->publication->lecture_id)];
    }

    public function broadcastAs(): string
    {
        return 'question.closed';
    }

    public function broadcastWith(): array
    {
        return [
            'publication_id' => $this->publication->id,
            'lecture_id' => $this->publication->lecture_id,
            'status' => $this->publication->status,
        ];
    }
}
