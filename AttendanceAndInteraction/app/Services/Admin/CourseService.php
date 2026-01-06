<?php

namespace App\Services\Admin;

use App\Traits\ApiResponseTrait;
use App\Repositories\CourseRepository;
use Illuminate\Support\Facades\Validator;

class CourseService
{
    use ApiResponseTrait;

    public function __construct(protected CourseRepository $repo) {}

    public function store($request)
    {
        $validated = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:courses,code',
            'name' => 'required|string|max:255',
            'is_active' => 'sometimes|boolean',
        ])->validate();

        $course = $this->repo->create($validated);

        return $this->unifiedResponse(true, 'Course created.', $course, [], 201);
    }

    public function index()
    {
        return $this->unifiedResponse(true, 'Courses list.', $this->repo->all());
    }

    public function show(int $id)
    {
        $course = $this->repo->find($id);
        if (!$course) return $this->unifiedResponse(false, 'Course not found.', [], [], 404);

        return $this->unifiedResponse(true, 'Course details.', $course);
    }

    public function update($request, int $id)
    {
        $course = $this->repo->find($id);
        if (!$course) return $this->unifiedResponse(false, 'Course not found.', [], [], 404);

        $validated = Validator::make($request->all(), [
            'code' => 'sometimes|string|max:50|unique:courses,code,' . $id,
            'name' => 'sometimes|string|max:255',
            'is_active' => 'sometimes|boolean',
        ])->validate();

        $updated = $this->repo->update($course, $validated);

        return $this->unifiedResponse(true, 'Course updated.', $updated);
    }

    public function destroy(int $id)
    {
        $course = $this->repo->find($id);
        if (!$course) return $this->unifiedResponse(false, 'Course not found.', [], [], 404);

        $this->repo->delete($course);

        return $this->unifiedResponse(true, 'Course deleted.', []);
    }
}
