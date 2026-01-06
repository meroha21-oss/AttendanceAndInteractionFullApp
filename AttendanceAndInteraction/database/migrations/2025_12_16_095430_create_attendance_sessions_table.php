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
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lecture_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->dateTime('opened_at')->nullable();
            $table->dateTime('closed_at')->nullable();
            $table->timestamps();

            $table->unique('lecture_id');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};
