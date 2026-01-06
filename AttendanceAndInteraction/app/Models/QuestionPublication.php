<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuestionPublication extends Model
{
    protected $fillable = ['question_id','lecture_id','published_at','expires_at','status'];

    protected $casts = ['published_at'=>'datetime','expires_at'=>'datetime'];

    public function question(){ return $this->belongsTo(LectureQuestion::class,'question_id'); }
    public function lecture(){ return $this->belongsTo(Lecture::class); }
    public function answers(){ return $this->hasMany(QuestionAnswer::class,'publication_id'); }
}

