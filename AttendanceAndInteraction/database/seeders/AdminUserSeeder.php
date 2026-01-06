<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'full_name'     => 'Main Admin',
                'phone'         => '0000000000',
                'password'      => Hash::make('12345678'),
                'profile_photo' => null,
                'ip_address'    => null,
                'role'          => 'admin',
                'is_active'     => true,
            ]
        );
    }
}
