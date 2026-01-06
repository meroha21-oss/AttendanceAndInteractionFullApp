<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Section;
use App\Models\Enrollment;

class EnrollmentsSeeder extends Seeder
{
    public function run(): void
    {
        $sectionA = Section::where('name','Section A')->first();
        $sectionB = Section::where('name','Section B')->first();

        $students = User::where('role','student')->orderBy('id')->get();

        foreach ($students as $index => $student) {
            $targetSection = $index < 5 ? $sectionA : $sectionB;

            Enrollment::firstOrCreate([
                'section_id' => $targetSection->id,
                'student_id' => $student->id,
            ]);
        }
    }
}
