<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\UserManagementService;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    public function __construct(protected UserManagementService $service){}

    public function students(){ return $this->service->listByRole('student'); }
    public function teachers(){ return $this->service->listByRole('teacher'); }

    public function show($id){ return $this->service->show((int)$id); }

    public function update(Request $request, $id){ return $this->service->update($request,(int)$id); }

    public function toggleActive($id){ return $this->service->toggleActive((int)$id); }
}
