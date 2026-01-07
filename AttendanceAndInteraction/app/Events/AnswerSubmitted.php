<?php

namespace App\Events;

use App\Models\QuestionAnswer;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class AnswerSubmitted implements ShouldBroadcast
{
    use SerializesModels;

    public int $teacherId;

    public function __construct(public QuestionAnswer $answer)
    {
        $this->answer->loadMissing([
            'student:id,full_name',
            'publication:id,lecture_id',
            'question:id,type,points',
        ]);

        // teacherId = instructor_id للمحاضرة
        $lecture = \App\Models\Lecture::select('id','instructor_id')->find($this->answer->publication->lecture_id);
        $this->teacherId = (int)($lecture?->instructor_id ?? 0);
    }

    public function broadcastOn(): array
    {
        return [new Channel('teacher.' . $this->teacherId)];
    }

    public function broadcastAs(): string
    {
        return 'answer.submitted';
    }

    public function broadcastWith(): array
    {
        return [
            'lecture_id' => $this->answer->publication->lecture_id,
            'publication_id' => $this->answer->publication_id,
            'question_id' => $this->answer->question_id,
            'student' => [
                'id' => $this->answer->student_id,
                'full_name' => $this->answer->student?->full_name,
            ],
            'selected_option_id' => $this->answer->selected_option_id,
            'answer_text' => $this->answer->answer_text,
            'is_correct' => $this->answer->is_correct,
            'score' => $this->answer->score,
            'answered_at' => optional($this->answer->answered_at)->toDateTimeString(),
        ];
    }
}
