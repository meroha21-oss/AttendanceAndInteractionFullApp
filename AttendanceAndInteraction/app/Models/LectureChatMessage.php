<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\SerializesLocalDates;


class LectureChatMessage extends Model
{
    use SerializesLocalDates;
    
    protected $fillable = ['lecture_id','user_id','message','sent_at'];
    protected $casts = ['sent_at'=>'datetime'];

    public function lecture(){ return $this->belongsTo(Lecture::class); }
    public function user(){ return $this->belongsTo(User::class); }
}

