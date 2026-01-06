<?php

namespace App\Repositories;

class QuestionAnswerRepository
{
    public function upsertAnswer(array $keys, array $values){
        return \App\Models\QuestionAnswer::updateOrCreate($keys, $values);
    }

    public function listAnswers(int $publicationId){
        return \App\Models\QuestionAnswer::with(['student','selectedOption'])
            ->where('publication_id',$publicationId)->get();
    }
}
