<?php

namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    protected $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function create(array $data)
    {
        return User::create($data);
    }

    public function findByEmailOrPhone($credential)
    {
        return User::where('email', $credential)->orWhere('phone', $credential)->first();
    }

    public function getByRole(string $role)
    {
        return User::where('role', $role)->get();
    }

    public function findByIdAndRole(int $id, string $role): ?User
    {
        return User::where('id', $id)->where('role', $role)->first();
    }


}
