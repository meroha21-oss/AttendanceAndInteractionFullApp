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
        Schema::create('attendance_heartbeats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lecture_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();

            $table->dateTime('joined_at')->nullable();
            $table->dateTime('last_seen_at')->nullable();

            $table->timestamps();
            $table->unique(['lecture_id','student_id']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_heartbeats');
    }
};
