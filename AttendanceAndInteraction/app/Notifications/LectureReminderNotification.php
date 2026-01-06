<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LectureReminderNotification extends Notification
{
    use Queueable;

    public function __construct(public \App\Models\Lecture $lecture) {}

    public function via($notifiable){ return ['database']; }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'lecture_reminder',
            'lecture_id' => $this->lecture->id,
            'starts_at' => $this->lecture->starts_at,
            'course_id' => $this->lecture->course_id,
            'section_id' => $this->lecture->section_id,
            'message' => 'You have a lecture in 30 minutes.',
        ];
    }
}
