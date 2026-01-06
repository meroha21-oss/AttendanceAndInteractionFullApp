<?php

namespace App\Services\Admin;

use App\Traits\ApiResponseTrait;
use App\Repositories\EnrollmentRepository;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Validator;

class EnrollmentService
{
    use ApiResponseTrait;

    public function __construct(
        protected EnrollmentRepository $repo,
        protected UserRepository $userRepo
    ) {}

    public function store($request)
    {
        $validated = Validator::make($request->all(), [
            'section_id' => 'required|integer|exists:sections,id',
            'student_id' => 'required|integer|exists:users,id',
        ])->validate();

        $student = $this->userRepo->findByIdAndRole($validated['student_id'], 'student');
        if (!$student) return $this->unifiedResponse(false, 'User must have student role.', [], [], 422);

        $enrollment = $this->repo->create($validated['section_id'], $validated['student_id']);

        return $this->unifiedResponse(true, 'Enrollment created.', $enrollment, [], 201);
    }

    public function index()
    {
        return $this->unifiedResponse(true, 'Enrollments list.', $this->repo->all());
    }

    public function show(int $id)
    {
        $enrollment = $this->repo->find($id);
        if (!$enrollment) return $this->unifiedResponse(false, 'Enrollment not found.', [], [], 404);

        return $this->unifiedResponse(true, 'Enrollment details.', $enrollment);
    }

    public function listBySection(int $sectionId)
    {
        return $this->unifiedResponse(true, 'Section enrollments.', $this->repo->listBySection($sectionId));
    }

    public function destroy(int $id)
    {
        $enrollment = $this->repo->find($id);
        if (!$enrollment) return $this->unifiedResponse(false, 'Enrollment not found.', [], [], 404);

        $this->repo->delete($enrollment);

        return $this->unifiedResponse(true, 'Enrollment deleted.', []);
    }
    
    public function bulkStore($request)
    {
        $v = Validator::make($request->all(),[
            'section_id' => 'required|integer|exists:sections,id',
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'integer|distinct|exists:users,id',
        ])->validate();

        $results = [
            'added' => [],
            'already_enrolled' => [],
            'not_student_role' => [],
        ];

        foreach($v['student_ids'] as $studentId){
            $student = $this->userRepo->findByIdAndRole($studentId,'student');
            if(!$student){
                $results['not_student_role'][] = $studentId;
                continue;
            }

            $exists = \App\Models\Enrollment::where('section_id',$v['section_id'])
                ->where('student_id',$studentId)
                ->exists();

            if($exists){
                $results['already_enrolled'][] = $studentId;
                continue;
            }

            $en = $this->repo->create($v['section_id'],$studentId);
            $results['added'][] = $en;
        }

        return $this->unifiedResponse(true,'Bulk enrollment done.', $results, [], 200);
    }

}

