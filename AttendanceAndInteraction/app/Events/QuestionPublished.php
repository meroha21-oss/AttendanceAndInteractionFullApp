<?php

namespace App\Events;

use App\Models\QuestionPublication;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class QuestionPublished implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(public QuestionPublication $publication)
    {
        $this->publication->loadMissing('question.options');
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('lecture.' . $this->publication->lecture_id)];
    }

    public function broadcastAs(): string
    {
        return 'question.published';
    }

    public function broadcastWith(): array
    {
        $q = $this->publication->question;

        return [
            'publication' => [
                'id' => $this->publication->id,
                'lecture_id' => $this->publication->lecture_id,
                'status' => $this->publication->status,
                'published_at' => optional($this->publication->published_at)->toDateTimeString(),
                'expires_at' => optional($this->publication->expires_at)->toDateTimeString(),
            ],
            'question' => [
                'id' => $q->id,
                'type' => $q->type,
                'question_text' => $q->question_text,
                'points' => $q->points,
                'options' => $q->options->map(fn($o) => [
                    'id' => $o->id,
                    'text' => $o->option_text,
                ])->values(),
            ],
        ];
    }
}
