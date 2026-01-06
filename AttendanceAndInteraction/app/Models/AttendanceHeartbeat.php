<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\SerializesLocalDates;


class AttendanceHeartbeat extends Model
{
    use HasFactory;
    use SerializesLocalDates;

    protected $table = 'attendance_heartbeats';

    protected $fillable = [
        'lecture_id',
        'student_id',
        'joined_at',
        'last_seen_at',
    ];

    protected $casts = [
        'joined_at'    => 'datetime',
        'last_seen_at'=> 'datetime',
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
