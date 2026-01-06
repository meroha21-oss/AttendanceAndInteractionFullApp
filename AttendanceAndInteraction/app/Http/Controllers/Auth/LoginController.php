<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\LoginLogoutService;
use Illuminate\Http\Request;

class LoginController extends Controller
{
    protected $loginLogoutService;

    public function __construct(LoginLogoutService $loginLogoutService)
    {
        $this->loginLogoutService = $loginLogoutService;
    }

    public function login(Request $request)
    {
        $result = $this->loginLogoutService->login($request);
        return $result;
    }

    public function logout(Request $request)
    {
        $result = $this->loginLogoutService->logout($request);
        return $result;
    }

    public function refresh(Request $request)
    {
        $result = $this->loginLogoutService->refresh($request);
        return $result;
    }
}
