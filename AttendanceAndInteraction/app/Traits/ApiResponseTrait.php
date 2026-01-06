<?php

namespace App\Traits;

trait ApiResponseTrait
{
    public function unifiedResponse($success, $message, $data = [], $errors = [], $status = 200)
    {
        return response()->json([
            'success' => $success,
            'message' => $message,
            'data' => $data,
            'errors' => $errors,
            'status'  => $status,
        ], $status);
    }
}
