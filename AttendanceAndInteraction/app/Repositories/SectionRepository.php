<?php

namespace App\Repositories;

use App\Models\Section;

class SectionRepository
{
    public function create(array $data): Section
    {
        return Section::create($data);
    }

    public function all()
    {
        return Section::orderByDesc('id')->get();
    }

    public function find(int $id): ?Section
    {
        return Section::find($id);
    }

    public function update(Section $section, array $data): Section
    {
        $section->update($data);
        return $section;
    }

    public function delete(Section $section): void
    {
        $section->delete();
    }
}
