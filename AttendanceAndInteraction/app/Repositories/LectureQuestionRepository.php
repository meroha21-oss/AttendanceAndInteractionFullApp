<?php

namespace App\Repositories;


class LectureQuestionRepository
{
    public function create(array $data){ return \App\Models\LectureQuestion::create($data); }

    public function find(int $id){
        return \App\Models\LectureQuestion::with(['options','lecture'])->find($id);
    }

    public function findByLecture(int $lectureId, int $questionId){
        return \App\Models\LectureQuestion::with(['options'])
            ->where('lecture_id', $lectureId)
            ->where('id', $questionId)
            ->first();
    }

    public function listByLecture(int $lectureId){
        return \App\Models\LectureQuestion::with('options')
            ->where('lecture_id',$lectureId)->orderByDesc('id')->get();
    }

    public function update($q, array $data){ $q->update($data); return $q; }

    public function delete($q){ $q->delete(); }
}
