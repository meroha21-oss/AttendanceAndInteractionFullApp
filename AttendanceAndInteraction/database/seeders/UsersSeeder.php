<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@uni.test'],
            [
                'full_name' => 'Admin User',
                'phone' => '1000000001',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        // Teachers
        for ($i=1; $i<=3; $i++) {
            User::firstOrCreate(
                ['email' => "teacher{$i}@uni.test"],
                [
                    'full_name' => "Teacher {$i}",
                    'phone' => '200000000' . $i,
                    'password' => Hash::make('password'),
                    'role' => 'teacher',
                    'is_active' => true,
                ]
            );
        }

        // Students
        for ($i=1; $i<=10; $i++) {
            User::firstOrCreate(
                ['email' => "student{$i}@uni.test"],
                [
                    'full_name' => "Student {$i}",
                    'phone' => '300000000' . $i,
                    'password' => Hash::make('password'),
                    'role' => 'student',
                    'is_active' => true,
                ]
            );
        }
    }
}
