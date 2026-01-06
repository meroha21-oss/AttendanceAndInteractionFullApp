<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\SerializesLocalDates;


class CourseAssignment extends Model
{
    use SerializesLocalDates;

    protected $fillable = [
        'section_id','course_id','instructor_id',
        'first_starts_at','duration_minutes','total_lectures','is_active'
    ];

    protected $casts = [
        'first_starts_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function section() { return $this->belongsTo(Section::class); }
    public function course() { return $this->belongsTo(Course::class); }
    public function instructor() { return $this->belongsTo(User::class, 'instructor_id'); }
    public function lectures() { return $this->hasMany(Lecture::class, 'assignment_id'); }
}
