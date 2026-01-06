<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\SerializesLocalDates;


class Course extends Model
{
    use SerializesLocalDates;
    
    protected $fillable = ['code','name','is_active'];

    public function schedules()
    {
        return $this->hasMany(SectionSchedule::class);
    }

    public function lectures()
    {
        return $this->hasMany(Lecture::class);
    }
}
