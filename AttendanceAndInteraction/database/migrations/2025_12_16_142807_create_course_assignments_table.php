<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('course_assignments', function (\Illuminate\Database\Schema\Blueprint $table) {
            $table->id();

            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();

            $table->dateTime('first_starts_at');
            $table->unsignedSmallInteger('duration_minutes')->default(120);

            $table->unsignedSmallInteger('total_lectures');
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->unique(['section_id','course_id','instructor_id'], 'assign_unique');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_assignments');
    }
};
