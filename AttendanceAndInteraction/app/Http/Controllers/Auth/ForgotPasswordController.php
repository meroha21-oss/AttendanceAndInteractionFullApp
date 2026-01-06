<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\ResetPasswordRequest;
use App\Services\Auth\ForgotPasswordService;
use App\Services\Auth\ResetPasswordService;
use Illuminate\Support\Facades\Validator;

class ForgotPasswordController extends Controller
{
    protected $forgotPasswordService;
    protected $resetPasswordService;

    public function __construct(ForgotPasswordService $forgotPasswordService, ResetPasswordService $resetPasswordService)
    {
        $this->forgotPasswordService = $forgotPasswordService;
        $this->resetPasswordService = $resetPasswordService;
    }

    public function sendResetCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return $this->unifiedResponse(false, 'Validation failed.', [], $validator->errors()->toArray(), 422);
        }

        $result = $this->forgotPasswordService->sendResetCode($request->email);
        return $result;
    }

    public function reset(ResetPasswordRequest $request)
    {
        $result = $this->resetPasswordService->resetPassword(
            $request->email,
            $request->code,
            $request->password
        );
        return $result;
    }
}

