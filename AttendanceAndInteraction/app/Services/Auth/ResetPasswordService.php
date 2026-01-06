<?php
namespace App\Services\Auth;

use App\Models\User;
use App\Models\PasswordResetCode;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Traits\ApiResponseTrait;
use Carbon\Carbon;

class ResetPasswordService
{
    use ApiResponseTrait;

    public function resetPassword($email, $code, $password)
    {
        try {
            $resetCode = PasswordResetCode::where('email', $email)
                ->where('code', $code)
                ->first();

            if (!$resetCode || Carbon::parse($resetCode->created_at)->addMinutes(60)->isPast()) {
                return $this->unifiedResponse(false, 'Invalid or expired reset code.', [], [], 422);
            }

            $user = User::where('email', $email)->first();
            $user->password = Hash::make($password);
            $user->save();

            $resetCode->delete();

            return $this->unifiedResponse(true, 'Password has been reset.', [], [], 200);
        } catch (\Exception $e) {
            Log::error('Error resetting password: ' . $e->getMessage());
            return $this->unifiedResponse(false, 'Failed to reset password.', [], ['error' => $e->getMessage()], 500);
        }
    }
}
