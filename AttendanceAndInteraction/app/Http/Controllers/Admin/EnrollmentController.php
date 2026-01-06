<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\EnrollmentService;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function __construct(protected EnrollmentService $service) {}

    public function store(Request $request) { return $this->service->store($request); }
    public function index() { return $this->service->index(); }
    public function show($id) { return $this->service->show((int)$id); }
    public function listBySection($sectionId) { return $this->service->listBySection((int)$sectionId); }
    public function destroy($id) { return $this->service->destroy((int)$id); }
    public function bulkStore(Request $request) { return $this->service->bulkStore($request); }

}
