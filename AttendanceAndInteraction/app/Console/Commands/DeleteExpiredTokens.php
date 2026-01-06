<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class DeleteExpiredTokens extends Command
{
    protected $signature = 'tokens:delete-expired';
    protected $description = 'Delete expired access and refresh tokens';

    public function __construct()
    {
        parent::__construct();
    }

    public function handle()
    {
        Log::info('DeleteExpiredTokens command started.');

        $now = Carbon::now();
        $threeDaysAgo = $now->subDays(3);

        // Set an expiration date for tokens with null expires_at
        $updated = DB::table('personal_access_tokens')
            ->whereNull('expires_at')
            ->update(['expires_at' => Carbon::now()->addDays(7)]);

        Log::info("Updated {$updated} tokens with null expires_at.");

        // Delete expired personal access tokens
        $deletedAccessTokens = DB::table('personal_access_tokens')
            ->where('expires_at', '<', $threeDaysAgo)
            ->delete();

        Log::info("Deleted {$deletedAccessTokens} expired personal access tokens.");

        // Delete expired refresh tokens in users table
        $updatedRefreshTokens = DB::table('users')
            ->where('refresh_token_expires_at', '<', $threeDaysAgo)
            ->update(['refresh_token' => null]);

        Log::info("Updated {$updatedRefreshTokens} expired refresh tokens.");

        $this->info('Expired tokens deleted successfully.');
    }
}
