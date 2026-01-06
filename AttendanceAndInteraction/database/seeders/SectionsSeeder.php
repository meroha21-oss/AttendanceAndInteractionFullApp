<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Section;

class SectionsSeeder extends Seeder
{
    public function run(): void
    {
        Section::firstOrCreate(['name' => 'Section A', 'semester' => 'Fall', 'year' => 2025], ['is_active' => true]);
        Section::firstOrCreate(['name' => 'Section B', 'semester' => 'Fall', 'year' => 2025], ['is_active' => true]);
    }
}
