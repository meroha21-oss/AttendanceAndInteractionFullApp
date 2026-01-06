<?php
namespace App\Services\Auth;

use App\Models\User;
use App\Traits\ApiResponseTrait;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Services\Auth\TwoFactorService;

class LoginLogoutService
{
    use ApiResponseTrait;

    protected $userRepository;
    protected $twoFactorService;

    public function __construct(UserRepository $userRepository, TwoFactorService $twoFactorService)
    {
        $this->userRepository = $userRepository;
        $this->twoFactorService = $twoFactorService;
    }

    public function login($request)
    {
        $validated = Validator::make($request->all(), [
            'login' => 'required|string',
            'password' => 'required|string',
        ])->validate();

        $user = $this->userRepository->findByEmailOrPhone($validated['login']);

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            Log::error('Invalid credentials for user: ' . $validated['login']);
            return $this->unifiedResponse(false, 'Invalid credentials.', [], [], 401);
        }
       if (!$user->is_active) {
           return $this->unifiedResponse(false, 'Your account is deactivated. Please contact support.', [], [], 403);
       }

        // if (!$user->email_verified_at) {
        //     Log::error('Email not verified for user: ' . $user->id);
        //     return $this->unifiedResponse(false, 'Email not verified.', [], [], 403);
        // }

    //    if ($user->two_factor_enabled) {
    //        return $this->unifiedResponse(true, '2FA required.', ['user_id' => $user->id], [], 200);
    //    }

        $token = $user->createToken('auth_token')->plainTextToken;
        $refreshToken = Str::random(60);
        $user->refresh_token = $refreshToken;
        $user->refresh_token_expires_at = Carbon::now()->addMinutes(14400);
        $user->save();

        return $this->unifiedResponse(true, 'Login successful.', [
            'access_token' => $token,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'user' => [
                'id'        => $user->id,
                'full_name' => $user->full_name,
                'email'     => $user->email,
                'role'      => $user->role,   // 👈 هون
            ],
        ], [], 200);
    }


    public function logout($request)
    {
        $request->user()->currentAccessToken()->delete();
        return $this->unifiedResponse(true, 'Logged out successfully.', [], [], 200);
    }

    public function refresh($request)
    {
        $validated = Validator::make($request->all(), [
            'refresh_token' => 'required|string',
        ])->validate();

        $user = User::where('refresh_token', $validated['refresh_token'])
                    ->where('refresh_token_expires_at', '>', Carbon::now())
                    ->first();

        if (!$user) {
            return $this->unifiedResponse(false, 'Invalid or expired refresh token.', [], [], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $refreshToken = Str::random(60);
        $user->refresh_token = $refreshToken;
        $user->refresh_token_expires_at = Carbon::now()->addMinutes(20);
        $user->save();

        return $this->unifiedResponse(true, 'New refresh token successfully.', [
            'access_token' => $token,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 1200
        ], [], 200);
    }
}
