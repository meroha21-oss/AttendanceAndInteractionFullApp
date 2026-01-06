<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Services\Auth\RegisterService;
use App\Services\Auth\EmailVerificationService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class RegisterController extends Controller
{
    use ApiResponseTrait;

    protected $registerService;
    protected $emailVerificationService;

    public function __construct(RegisterService $registerService, EmailVerificationService $emailVerificationService)
    {
        $this->registerService = $registerService;
        $this->emailVerificationService = $emailVerificationService;
    }

    public function register(RegisterRequest $request)
    {
        $result = $this->registerService->register($request);
        return $result;
    }

    public function verifyEmail(Request $request)
    {
        $result = $this->emailVerificationService->verifyEmail($request);
        return $result;
    }

    public function resendVerificationCode(Request $request)
    {
        $result = $this->emailVerificationService->resendVerificationCode($request);
        return $result;
    }
}
