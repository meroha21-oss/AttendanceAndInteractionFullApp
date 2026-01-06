<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\SerializesLocalDates;


class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
    use SerializesLocalDates;

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'password',
        'profile_photo',
        'email_verified_at',
        'is_active',
        'ip_address',
        'role',
        'refresh_token',
        'refresh_token_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'refresh_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'refresh_token_expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function enrollments()
    {
        return $this->hasMany(\App\Models\Enrollment::class, 'student_id');
    }

    public function enrolledSections()
    {
        return $this->belongsToMany(\App\Models\Section::class, 'enrollments', 'student_id', 'section_id');
    }

    public function teachingSchedules()
    {
        return $this->hasMany(\App\Models\SectionSchedule::class, 'instructor_id');
    }
}
