<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SectionSchedule extends Model
{
    protected $fillable = [
        'section_id','course_id','instructor_id','day_of_week','start_time','duration_minutes','is_active'
    ];

    public function section() { return $this->belongsTo(Section::class); }
    public function course() { return $this->belongsTo(Course::class); }
    public function instructor() { return $this->belongsTo(User::class, 'instructor_id'); }
}
