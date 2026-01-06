<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\SerializesLocalDates;


class AttendanceSession extends Model
{
    use HasFactory;
    use SerializesLocalDates;

    protected $table = 'attendance_sessions';

    protected $fillable = [
        'lecture_id',
        'started_at',
        'ended_at',
        'ended_by',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at'   => 'datetime',
    ];

    /* ================= Relations ================= */

    public function lecture()
    {
        return $this->belongsTo(Lecture::class);
    }

    public function endedBy()
    {
        return $this->belongsTo(User::class, 'ended_by');
    }
}
