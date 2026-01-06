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
        Schema::create('question_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publication_id')->constrained('question_publications')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('lecture_questions')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();

            $table->foreignId('selected_option_id')->nullable()->constrained('question_options')->nullOnDelete();
            $table->text('answer_text')->nullable();

            $table->boolean('is_correct')->nullable();
            $table->unsignedSmallInteger('score')->default(0);

            $table->timestamp('answered_at')->nullable();
            $table->timestamps();

            $table->unique(['publication_id','student_id'], 'pub_student_unique');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_answers');
    }
};
