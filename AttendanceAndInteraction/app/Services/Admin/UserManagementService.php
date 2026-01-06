<?php

namespace App\Services\Admin;

use App\Traits\ApiResponseTrait;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

class UserManagementService
{
    use ApiResponseTrait;

    public function listByRole(string $role)
    {
        $users = User::where('role',$role)->orderByDesc('id')->get();
        return $this->unifiedResponse(true, ucfirst($role).' list.', $users);
    }

    public function show(int $id)
    {
        $u = User::find($id);
        if(!$u) return $this->unifiedResponse(false,'User not found.',[],[],404);
        return $this->unifiedResponse(true,'User details.', $u);
    }

    public function update($request, int $id)
    {
        $u = User::find($id);
        if(!$u) return $this->unifiedResponse(false,'User not found.',[],[],404);

        $v = Validator::make($request->all(),[
            'full_name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:50',
            'email' => 'sometimes|email|max:255|unique:users,email,'.$id,
            'is_active' => 'sometimes|boolean',
        ])->validate();

        $u->update($v);
        return $this->unifiedResponse(true,'User updated.', $u);
    }

    public function toggleActive(int $id)
    {
        $u = User::find($id);
        if(!$u) return $this->unifiedResponse(false,'User not found.',[],[],404);

        $u->is_active = !$u->is_active;
        $u->save();

        return $this->unifiedResponse(true,'User status updated.', [
            'id'=>$u->id,
            'is_active'=>$u->is_active
        ]);
    }
}
