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
        Schema::create('question_publications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('lecture_questions')->cascadeOnDelete();
            $table->foreignId('lecture_id')->constrained('lectures')->cascadeOnDelete();

            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');

            $table->timestamps();

            $table->index(['lecture_id','status']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_publications');
    }
};
