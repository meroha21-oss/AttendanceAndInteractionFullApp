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
        Schema::table('lectures', function (\Illuminate\Database\Schema\Blueprint $table) {
            $table->foreignId('assignment_id')
                ->nullable()
                ->after('id')
                ->constrained('course_assignments')
                ->nullOnDelete();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropColumn('assignment_id');
        });
    }
};
