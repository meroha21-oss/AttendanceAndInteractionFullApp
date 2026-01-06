<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\SerializesLocalDates;


class Lecture extends Model
{
    use SerializesLocalDates;

    // protected $fillable = [
    //     'section_id','course_id','instructor_id','scheduled_date','starts_at','ends_at','status','lecture_no','ended_at'
    // ];
    protected $fillable = [
        'assignment_id',
        'lecture_no',
        'section_id',
        'course_id',
        'instructor_id',
        'scheduled_date',
        'starts_at',
        'ends_at',
        'status',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'ended_at' => 'datetime',
        'scheduled_date' => 'date:Y-m-d',

        // 'scheduled_date' => 'date',
    ];

    public function section() { return $this->belongsTo(Section::class); }
    public function course() { return $this->belongsTo(Course::class); }
    public function instructor() { return $this->belongsTo(User::class, 'instructor_id'); }
    public function assignment()
    {
        return $this->belongsTo(\App\Models\CourseAssignment::class, 'assignment_id');
    }

}
