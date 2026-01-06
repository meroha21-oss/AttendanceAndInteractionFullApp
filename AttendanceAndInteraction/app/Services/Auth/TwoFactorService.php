<?php
namespace App\Services\Auth;

use ParagonIE\ConstantTime\Base32;
use OTPHP\TOTP;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use App\Traits\ApiResponseTrait;

class TwoFactorService
{
    use ApiResponseTrait;

    public function generateSecretKey()
    {
        return random_int(100000, 999999);
    }

    public function verifyKey($user, $oneTimePassword)
    {
        try {
            $otp = TOTP::create($user->two_factor_secret);
            \Log::info('Generated OTP: ' . $otp->now());
            $result = $otp->verify($oneTimePassword);
            \Log::info('OTP Verification Result: ' . ($result ? 'Success' : 'Failure'));
            return $result;
        } catch (\Exception $e) {
            \Log::error('Error during OTP verification: ' . $e->getMessage());
            return false;
        }
    }

    public function enableTwoFactorAuth($user)
    {
        try {
            $secret = $this->generateSecretKey();
            $user->two_factor_secret = $secret;
            $user->two_factor_enabled = true;
            $user->save();
            \Log::info('2FA Secret Key Generated: ' . $secret);
            $email = $user->email;
            Mail::send('emails.2FA', ['secret' => $secret], function($message) use ($email) {
                $message->to($email);
                $message->subject('Two-Factor Authentication Code');
            });
            return $this->unifiedResponse(true, '2FA enabled successfully.', ['secret' => $secret], [], 200); # [MODIFIED] - Return unifiedResponse
        } catch (\Exception $e) {
            \Log::error('Error enabling 2FA: ' . $e->getMessage());
            return $this->unifiedResponse(false, 'Failed to enable 2FA.', [], ['error' => $e->getMessage()], 500); # [MODIFIED] - Return unifiedResponse
        }
    }

    public function disableTwoFactorAuth($user)
    {
        try {
            $user->two_factor_secret = null;
            $user->two_factor_enabled = false;
            $user->save();
            return $this->unifiedResponse(true, '2FA disabled successfully.', [], [], 200); # [MODIFIED] - Return unifiedResponse
        } catch (\Exception $e) {
            \Log::error('Error disabling 2FA: ' . $e->getMessage());
            return $this->unifiedResponse(false, 'Failed to disable 2FA.', [], ['error' => $e->getMessage()], 500); # [MODIFIED] - Return unifiedResponse
        }
    }

    public function verify2FA($request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer',
            'one_time_password' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(false, 'Validation failed.', [], $validator->errors()->toArray(), 422);
        }

        $user = User::find($request->user_id);
        if (!$user) {
            return $this->unifiedResponse(false, 'User not found.', [], [], 404);
        }

        $valid = $this->verifyKey($user, $request->one_time_password);
        if ($valid) {
            $token = $user->createToken('authToken')->plainTextToken;
            return $this->unifiedResponse(true, '2FA verification successful.', ['token' => $token], [], 200);
        }

        return $this->unifiedResponse(false, 'Invalid 2FA code.', [], [], 401);
    }
}
