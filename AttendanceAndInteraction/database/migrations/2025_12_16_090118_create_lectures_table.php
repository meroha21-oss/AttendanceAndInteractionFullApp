<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lectures', function (Blueprint $table) {
            $table->id();

            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();

            $table->date('scheduled_date');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');

            $table->enum('status', ['scheduled','running','ended','cancelled'])->default('scheduled');

            $table->unsignedSmallInteger('lecture_no')->nullable(); 
            $table->dateTime('ended_at')->nullable();

            $table->timestamps();

            $table->unique(['section_id','course_id','scheduled_date','starts_at'], 'lecture_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lectures');
    }
};
