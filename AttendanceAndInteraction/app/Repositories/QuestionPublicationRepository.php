<?php

namespace App\Repositories;

class QuestionPublicationRepository
{
    public function create(array $data){ return \App\Models\QuestionPublication::create($data); }

    public function find(int $id){
        return \App\Models\QuestionPublication::with(['question.options','answers.student'])->find($id);
    }

    public function listByLecture(int $lectureId){
        return \App\Models\QuestionPublication::with('question')
            ->where('lecture_id',$lectureId)->orderByDesc('id')->get();
    }
}
