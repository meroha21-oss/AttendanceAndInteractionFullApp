<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionAnswer extends Model
{
    protected $fillable = [
        'publication_id','question_id','student_id',
        'selected_option_id','answer_text','is_correct','score','answered_at'
    ];

    protected $casts = ['answered_at'=>'datetime','is_correct'=>'boolean'];

    public function publication(){ return $this->belongsTo(QuestionPublication::class,'publication_id'); }
    public function question(){ return $this->belongsTo(LectureQuestion::class,'question_id'); }
    public function student(){ return $this->belongsTo(User::class,'student_id'); }
    public function selectedOption(){ return $this->belongsTo(QuestionOption::class,'selected_option_id'); }
}

