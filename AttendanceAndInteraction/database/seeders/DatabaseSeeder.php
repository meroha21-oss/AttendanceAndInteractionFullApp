<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UsersSeeder::class,
            CoursesSeeder::class,
            SectionsSeeder::class,
            EnrollmentsSeeder::class,
            SectionSchedulesSeeder::class,
        ]);
    }
}
