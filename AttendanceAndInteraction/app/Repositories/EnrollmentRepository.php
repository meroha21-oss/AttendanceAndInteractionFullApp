<?php

namespace App\Repositories;

use App\Models\Enrollment;

class EnrollmentRepository
{
    public function create(int $sectionId, int $studentId): Enrollment
    {
        return Enrollment::firstOrCreate([
            'section_id' => $sectionId,
            'student_id' => $studentId,
        ]);
    }

    public function all()
    {
        return Enrollment::with(['student','section'])->orderByDesc('id')->get();
    }

    public function find(int $id): ?Enrollment
    {
        return Enrollment::with(['student','section'])->find($id);
    }

    public function listBySection(int $sectionId)
    {
        return Enrollment::with('student')
            ->where('section_id', $sectionId)
            ->orderByDesc('id')
            ->get();
    }

    public function delete(Enrollment $enrollment): void
    {
        $enrollment->delete();
    }
}
