<?php
namespace App\Services\Auth;

use App\Models\User;
use App\Models\UserVerify;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Traits\ApiResponseTrait;
use Exception;

class EmailVerificationService
{
    use ApiResponseTrait;

    public function verifyEmail($request)
    {
        try {
            $cachedData = Cache::get($request->ip());
            $email = $cachedData[1] ?? null;
            $code = $cachedData[0] ?? null;

            if (!$cachedData) {
                return $this->unifiedResponse(false, 'Your verification code was expired.', [], [], 422);
            }

            if ($code === $request->token) {
                $user = User::whereEmail($email)->first();

                if ($user) {
                    $user->email_verified_at = now();
                    $user->save();

                    return $this->unifiedResponse(true, 'Email verified successfully.', [], [], 200);
                }

                return $this->unifiedResponse(false, 'User not found.', [], [], 404);
            }

            return $this->unifiedResponse(false, 'Invalid or expired token.', [], [], 422);
        } catch (Exception $e) {
            Log::error('Email verification error: ' . $e->getMessage());
            return $this->unifiedResponse(false, 'Email verification failed. Please try again later.', [], ['error' => $e->getMessage()], 500);
        }
    }

    public function resendVerificationCode($request)
    {
        try {
            $ip = $request->ip();
            $attempts = Cache::get("resend_attempts_{$ip}", 0);
            Log::info("Resend attempts for IP {$ip}: {$attempts}");

            if ($attempts >= 2) {
                return $this->unifiedResponse(false, 'Too many attempts. Please try again later.', [], [], 429);
            }

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return $this->unifiedResponse(false, 'User not found.', [], [], 404);
            }

            $code = Str::random(6);

            UserVerify::updateOrCreate(
                ['user_id' => $user->id],
                ['token' => $code]
            );

            Mail::send('emails.verifyEmail', ['token' => $code], function($message) use ($request) {
                $message->to($request->email);
                $message->subject('Email Verification Code');
            });

            Cache::put($ip, [$code, $request->email], now()->addMinutes(10));
            Cache::put("resend_attempts_{$ip}", $attempts + 1, now()->addMinutes(10));

            Log::info("Verification code for IP {$ip}: {$code}");
            return $this->unifiedResponse(true, 'Verification code resent successfully.', [], [], 200);
        } catch (Exception $e) {
            Log::error('Resend verification code error: ' . $e->getMessage());
            return $this->unifiedResponse(false, 'Failed to resend verification code. Please try again later.', [], ['error' => $e->getMessage()], 500);
        }
    }
}
