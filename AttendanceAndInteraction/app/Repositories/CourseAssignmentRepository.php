<?php

namespace App\Repositories;

use App\Models\CourseAssignment;

class CourseAssignmentRepository
{
    public function create(array $data): CourseAssignment
    {
        return CourseAssignment::create($data);
    }

    public function all()
    {
        return CourseAssignment::with(['section','course','instructor'])
            ->orderByDesc('id')->get();
    }

    public function find(int $id): ?CourseAssignment
    {
        return CourseAssignment::with(['section','course','instructor','lectures'])->find($id);
    }

    public function update(CourseAssignment $assignment, array $data): CourseAssignment
    {
        $assignment->update($data);
        return $assignment;
    }

    public function delete(CourseAssignment $assignment): void
    {
        $assignment->delete();
    }
}
