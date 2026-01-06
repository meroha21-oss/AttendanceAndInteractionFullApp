<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LectureQuestion extends Model
{
    protected $fillable = ['lecture_id','teacher_id','type','question_text','points','is_active'];

    public function lecture(){ return $this->belongsTo(Lecture::class); }
    public function teacher(){ return $this->belongsTo(User::class, 'teacher_id'); }
    public function options(){ return $this->hasMany(QuestionOption::class,'question_id'); }
    public function publications(){ return $this->hasMany(QuestionPublication::class,'question_id'); }
}

