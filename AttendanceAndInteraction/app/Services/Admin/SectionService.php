<?php

namespace App\Services\Admin;

use App\Traits\ApiResponseTrait;
use App\Repositories\SectionRepository;
use Illuminate\Support\Facades\Validator;

class SectionService
{
    use ApiResponseTrait;

    public function __construct(protected SectionRepository $repo) {}

    public function store($request)
    {
        $validated = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'semester' => 'required|string|max:50',
            'year' => 'required|integer|min:2000|max:2100',
            'is_active' => 'sometimes|boolean',
        ])->validate();

        $section = $this->repo->create($validated);

        return $this->unifiedResponse(true, 'Section created.', $section, [], 201);
    }

    public function index()
    {
        return $this->unifiedResponse(true, 'Sections list.', $this->repo->all());
    }

    public function show(int $id)
    {
        $section = $this->repo->find($id);
        if (!$section) return $this->unifiedResponse(false, 'Section not found.', [], [], 404);

        return $this->unifiedResponse(true, 'Section details.', $section);
    }

    public function update($request, int $id)
    {
        $section = $this->repo->find($id);
        if (!$section) return $this->unifiedResponse(false, 'Section not found.', [], [], 404);

        $validated = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'semester' => 'sometimes|string|max:50',
            'year' => 'sometimes|integer|min:2000|max:2100',
            'is_active' => 'sometimes|boolean',
        ])->validate();

        $updated = $this->repo->update($section, $validated);

        return $this->unifiedResponse(true, 'Section updated.', $updated);
    }

    public function destroy(int $id)
    {
        $section = $this->repo->find($id);
        if (!$section) return $this->unifiedResponse(false, 'Section not found.', [], [], 404);

        $this->repo->delete($section);

        return $this->unifiedResponse(true, 'Section deleted.', []);
    }
}
