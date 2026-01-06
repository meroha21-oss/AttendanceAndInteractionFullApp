<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\CourseAssignmentService;
use Illuminate\Http\Request;

class CourseAssignmentController extends Controller
{
    public function __construct(protected CourseAssignmentService $service) {}

    public function store(Request $request) { return $this->service->store($request); }
    public function index() { return $this->service->index(); }
    public function show($id) { return $this->service->show((int)$id); }
    public function update(Request $request, $id) { return $this->service->update($request, (int)$id); }
    public function destroy($id) { return $this->service->destroy((int)$id); }
}
