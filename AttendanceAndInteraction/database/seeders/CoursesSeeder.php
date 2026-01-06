<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;

class CoursesSeeder extends Seeder
{
    public function run(): void
    {
        Course::firstOrCreate(['code' => 'CS101'], ['name' => 'Programming 1', 'is_active' => true]);
        Course::firstOrCreate(['code' => 'CS102'], ['name' => 'Databases', 'is_active' => true]);
        Course::firstOrCreate(['code' => 'CS103'], ['name' => 'Networks', 'is_active' => true]);
    }
}
