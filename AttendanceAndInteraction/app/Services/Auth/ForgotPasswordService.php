<?php
namespace App\Services\Auth;

use Illuminate\Support\Facades\Log;
use App\Models\PasswordResetCode;
use Illuminate\Support\Facades\Mail;
use App\Traits\ApiResponseTrait;

class ForgotPasswordService
{
    use ApiResponseTrait;

    public function sendResetCode($email)
    {
        try {
            $code = mt_rand(100000, 999999);

            PasswordResetCode::updateOrCreate(
                ['email' => $email],
                ['code' => $code, 'created_at' => now()]
            );

            Mail::send('emails.reset_code', ['code' => $code], function($message) use ($email) {
                $message->to($email);
                $message->subject('Password Reset Code');
            });

            return $this->unifiedResponse(true, 'Reset code sent to your email.', [], [], 200);
        } catch (\Exception $e) {
            Log::error('Error sending reset code: ' . $e->getMessage());
            return $this->unifiedResponse(false, 'Failed to send reset code.', [], ['error' => $e->getMessage()], 500);
        }
    }
}
