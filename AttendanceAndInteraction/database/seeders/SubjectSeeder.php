<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Subject;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subjects = [
            ['name' => 'Mathematics', 'code' => 'MATH'],
            ['name' => 'Physics',     'code' => 'PHYS'],
            ['name' => 'Chemistry',   'code' => 'CHEM'],
            ['name' => 'Biology',     'code' => 'BIO'],
            ['name' => 'English',     'code' => 'ENG'],
            ['name' => 'History',     'code' => 'HIST'],
        ];

        foreach ($subjects as $subject) {
            Subject::firstOrCreate(
                ['name' => $subject['name']],
                ['code' => $subject['code']]
            );
        }
    }
}
