<?php
namespace App\Services\Auth;

use App\Models\User;
use App\Models\UserVerify;
use App\Models\TeacherProfile;
use App\Models\StudentProfile;
use App\Traits\ApiResponseTrait;
use App\Repositories\UserRepository;
use App\Traits\FileUploadTrait;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Exception;

class RegisterService
{
    use FileUploadTrait, ApiResponseTrait;

    protected $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function register($request)
    {
        try {
            $profilePhotoPath = $this->handleFileUpload($request, 'profile_photo', 'profile_photos');

            Log::info('Registration 1:', ['profile_photo' => $profilePhotoPath]);

            $userData = [
                'full_name'     => $request->full_name,
                'email'         => $request->email,
                'phone'         => $request->phone,
                'password'      => Hash::make($request->password),
                'profile_photo' => $profilePhotoPath['path'] ?? null,
                'ip_address'    => $request->ip(),
                'role'          => $request->role,
            ];


            Log::info('Registration 2:', $userData);

            $user = $this->userRepository->create($userData);
            // أو:
            // $user = User::create($userData);


            // if ($user->role === 'teacher') {
            //     TeacherProfile::create([
            //         'user_id' => $user->id,
            //     ]);
            // } elseif ($user->role === 'student') {
            //     StudentProfile::create([
            //         'user_id' => $user->id,
            //     ]);
            // }

            $code = Str::random(6);
            UserVerify::create([
                'user_id' => $user->id,
                'token'   => $code,
            ]);

            Cache::put($request->ip(), [$code, $request->email], now()->addMinutes(3));

            // Mail::send('emails.verifyEmail', ['token' => $code], function($message) use ($request) {
            //         $message->to($request->email);
            //         $message->subject('Email Verification Code');
            //     });

            return $this->unifiedResponse(true,
                'Registration successful, please check your email for verification code.',
                [
                    'user_id'           => $user->id,
                    'profile_photo' => $profilePhotoPath['path'] ?? null,
                    'profile_photo_url' => $profilePhotoPath['url'] ?? null,
                ],
                [],
                201
            );

        } catch (Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return $this->unifiedResponse(false, 'Registration failed. Please try again later.', [], [], 500);
        }
    }


    // public function register($request)
    // {
    //     try {
    //         $profilePhotoPath = $this->handleFileUpload($request, 'profile_photo', 'profile_photos');

    //         Log::error('Registration 1: ' . $profilePhotoPath);

    //         $userData = [
    //             'full_name' => $request->full_name,
    //             'email' => $request->email,
    //             'phone' => $request->phone,
    //             'password' => Hash::make($request->password),
    //             'profile_photo' => $profilePhotoPath['path'] ?? null,
    //             'ip_address' => $request->ip(),
    //         ];



    //         $user = User::create($userData);
    //         $code = Str::random(6);
    //         UserVerify::create(['user_id' => $user->id, 'token' => $code]);
    //         Cache::put($request->ip(), [$code, $request->email], now()->addMinutes(3));

    //         // Mail::send('emails.verifyEmail', ['token' => $code], function($message) use ($request) {
    //         //     $message->to($request->email);
    //         //     $message->subject('Email Verification Code');
    //         // });

    //         return $this->unifiedResponse(true, 'Registration successful, please check your email for verification code.', ['user_id' => $user->id,'profile_photo'   => $user->profile_photo,
    //         'profile_photo_url' => $upload['url'] ?? ($user->profile_photo ? asset('storage/'.$user->profile_photo) : null),], [], 201);

    //     } catch (Exception $e) {
    //         Log::error('Registration error: ' . $e->getMessage());
    //         return $this->unifiedResponse(false, 'Registration failed. Please try again later.', [], [], 500);
    //     }
    // }
}
