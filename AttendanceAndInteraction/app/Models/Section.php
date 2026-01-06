<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\SerializesLocalDates;


class Section extends Model
{
    use SerializesLocalDates;

    protected $fillable = ['name','semester','year','is_active'];

    public function schedules()
    {
        return $this->hasMany(SectionSchedule::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function students()
    {
        return $this->belongsToMany(User::class, 'enrollments', 'section_id', 'student_id');
    }

    public function lectures()
    {
        return $this->hasMany(Lecture::class);
    }
}
