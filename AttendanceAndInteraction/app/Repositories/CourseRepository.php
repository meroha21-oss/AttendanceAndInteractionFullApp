<?php

namespace App\Repositories;

use App\Models\Course;

class CourseRepository
{
    public function create(array $data): Course
    {
        return Course::create($data);
    }

    public function all()
    {
        return Course::orderByDesc('id')->get();
    }

    public function find(int $id): ?Course
    {
        return Course::find($id);
    }

    public function update(Course $course, array $data): Course
    {
        $course->update($data);
        return $course;
    }

    public function delete(Course $course): void
    {
        $course->delete();
    }
}
