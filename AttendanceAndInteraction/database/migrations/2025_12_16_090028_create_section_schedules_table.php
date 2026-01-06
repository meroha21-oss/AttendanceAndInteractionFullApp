<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('section_schedules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();

            $table->unsignedTinyInteger('day_of_week');
            $table->time('start_time');
            $table->unsignedSmallInteger('duration_minutes')->default(120);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['section_id','course_id','instructor_id','day_of_week','start_time'], 'schedule_unique_row');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('section_schedules');
    }
};
