<?php

namespace App\Repositories;

class QuestionPublicationRepository
{
    public function create(array $data){ return \App\Models\QuestionPublication::create($data); }

    public function find(int $id){
        return \App\Models\QuestionPublication::with(['question.options','answers.student'])->find($id);
    }

    // public function listByLecture(int $lectureId){
    //     return \App\Models\QuestionPublication::with('question')
    //         ->where('lecture_id',$lectureId)->orderByDesc('id')->get();
    // }
    public function listByLecture(int $lectureId, ?string $status = null){
        $q = \App\Models\QuestionPublication::with(['question.options'])
            ->where('lecture_id', $lectureId)
            ->orderByDesc('id');

        if ($status) $q->where('status', $status);

        return $q->get();
    }

    public function findByLecture(int $lectureId, int $publicationId){
        return \App\Models\QuestionPublication::with(['question.options','answers.student'])
            ->where('lecture_id', $lectureId)
            ->where('id', $publicationId)
            ->first();
    }
}
