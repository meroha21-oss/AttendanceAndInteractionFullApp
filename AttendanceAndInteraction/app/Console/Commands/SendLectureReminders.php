<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Lecture;
use App\Models\LectureReminder;
use App\Models\Enrollment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;
use App\Notifications\LectureReminderNotification;

class SendLectureReminders extends Command
{
    protected $signature = 'lectures:send-reminders';
    protected $description = 'Send lecture reminders 30 minutes before start';

    public function handle()
    {
        $now = Carbon::now();
        $from = $now->copy()->addMinutes(30)->subMinute();
        $to   = $now->copy()->addMinutes(30)->addMinute();

        $lectures = Lecture::whereBetween('starts_at', [$from, $to])
            ->whereIn('status',['scheduled'])
            ->get();

        foreach($lectures as $lecture){
            // prevent duplicates
            $exists = LectureReminder::where('lecture_id',$lecture->id)->exists();
            if($exists) continue;

            // recipients: teacher + enrolled students
            $teacher = User::find($lecture->instructor_id);
            $studentIds = Enrollment::where('section_id',$lecture->section_id)->pluck('student_id');
            $students = User::whereIn('id',$studentIds)->get();

            Notification::send($students, new LectureReminderNotification($lecture));
            if($teacher) $teacher->notify(new LectureReminderNotification($lecture));

            LectureReminder::create(['lecture_id'=>$lecture->id,'sent_at'=>$now]);
        }

        $this->info("Reminders sent: ".$lectures->count());
        return 0;
    }
}
