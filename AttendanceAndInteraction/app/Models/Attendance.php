<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\SerializesLocalDates;


class Attendance extends Model
{
    use HasFactory;
    use SerializesLocalDates;


    protected $table = 'attendances';

    protected $fillable = [
        'lecture_id',
        'student_id',
        'status',
        'checked_in_at',
        'last_seen_at',
        'minutes_attended',
    ];

    protected $casts = [
        'checked_in_at'   => 'datetime',
        'last_seen_at'    => 'datetime',
        'minutes_attended'=> 'integer',
    ];

    /* ================= Relations ================= */

    public function lecture()
    {
        return $this->belongsTo(Lecture::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
