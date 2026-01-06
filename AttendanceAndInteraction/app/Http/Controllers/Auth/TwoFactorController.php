<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\Auth\TwoFactorService;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class TwoFactorController extends Controller
{
    protected $twoFactorService;

    public function __construct(TwoFactorService $twoFactorService)
    {
        $this->twoFactorService = $twoFactorService;
    }

    public function enable(Request $request)
    {
        $user = Auth::user();
        $result = $this->twoFactorService->enableTwoFactorAuth($user);
        return $result; # [MODIFIED] - Return service result directly
    }

    public function disable(Request $request)
    {
        $user = Auth::user();
        $result = $this->twoFactorService->disableTwoFactorAuth($user);
        return $result; # [MODIFIED] - Return service result directly
    }

    public function verify(Request $request)
    {
        Log::info('Received 2FA verification request', $request->all());

        try {
            $result = $this->twoFactorService->verify2FA($request);
            return $result; # [MODIFIED] - Return service result directly
        } catch (\Exception $e) {
            Log::error('Error during 2FA verification: ' . $e->getMessage());
            return $this->unifiedResponse(false, 'An error occurred during 2FA verification.', [], ['error' => $e->getMessage()], 500);
        }
    }
}
