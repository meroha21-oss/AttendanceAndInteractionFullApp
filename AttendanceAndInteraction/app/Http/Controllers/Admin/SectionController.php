<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\SectionService;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function __construct(protected SectionService $service) {}

    public function store(Request $request) { return $this->service->store($request); }
    public function index() { return $this->service->index(); }
    public function show($id) { return $this->service->show((int)$id); }
    public function update(Request $request, $id) { return $this->service->update($request, (int)$id); }
    public function destroy($id) { return $this->service->destroy((int)$id); }
}
