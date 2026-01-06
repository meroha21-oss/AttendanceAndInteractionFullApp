<?php

namespace App\Repositories;

class LectureChatRepository
{
    public function create(array $data){ return \App\Models\LectureChatMessage::create($data); }

    public function list(int $lectureId, int $limit = 50){
        return \App\Models\LectureChatMessage::with('user:id,full_name,role')
            ->where('lecture_id',$lectureId)
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();
    }
}
