<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Course;
use App\Models\Section;
use App\Models\SectionSchedule;

class SectionSchedulesSeeder extends Seeder
{
    public function run(): void
    {
        $teacher1 = User::where('email','teacher1@uni.test')->first();
        $teacher2 = User::where('email','teacher2@uni.test')->first();

        $cs101 = Course::where('code','CS101')->first();
        $cs102 = Course::where('code','CS102')->first();

        $sectionA = Section::where('name','Section A')->first();

        // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu
        SectionSchedule::firstOrCreate([
            'section_id' => $sectionA->id,
            'course_id' => $cs101->id,
            'instructor_id' => $teacher1->id,
            'day_of_week' => 0,
            'start_time' => '10:00',
        ], [
            'duration_minutes' => 120,
            'is_active' => true,
        ]);

        SectionSchedule::firstOrCreate([
            'section_id' => $sectionA->id,
            'course_id' => $cs102->id,
            'instructor_id' => $teacher2->id,
            'day_of_week' => 2,
            'start_time' => '12:00',
        ], [
            'duration_minutes' => 120,
            'is_active' => true,
        ]);
    }
}
