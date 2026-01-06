<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DeleteExpiredTokensTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_deletes_expired_tokens()
    {
        // Arrange: Create tokens with different expiration dates
        DB::table('personal_access_tokens')->insert([
            ['expires_at' => Carbon::now()->subDays(4)],
            ['expires_at' => Carbon::now()->addDays(1)],
            ['expires_at' => null],
        ]);

        // Arrange: Create users with different refresh token expiration dates
        DB::table('users')->insert([
            ['refresh_token_expires_at' => Carbon::now()->subDays(4), 'refresh_token' => 'token1'],
            ['refresh_token_expires_at' => Carbon::now()->addDays(1), 'refresh_token' => 'token2'],
            ['refresh_token_expires_at' => null, 'refresh_token' => 'token3'],
        ]);

        Log::info('Initial state:', [
            'personal_access_tokens' => DB::table('personal_access_tokens')->get(),
            'users' => DB::table('users')->get(),
        ]);

        // Act: Run the command
        $this->artisan('tokens:delete-expired')->assertExitCode(0);

        Log::info('Final state:', [
            'personal_access_tokens' => DB::table('personal_access_tokens')->get(),
            'users' => DB::table('users')->get(),
        ]);

        // Assert: Check that the expired token is deleted
        $this->assertDatabaseMissing('personal_access_tokens', ['expires_at' => Carbon::now()->subDays(4)]);
        // Assert: Check that the non-expired token is still there
        $this->assertDatabaseHas('personal_access_tokens', ['expires_at' => Carbon::now()->addDays(1)]);
        // Assert: Check that the null expires_at token is updated
        $this->assertDatabaseHas('personal_access_tokens', ['expires_at' => Carbon::now()->addDays(7)]);

        // Assert: Check that the expired refresh token is nullified
        $this->assertDatabaseHas('users', ['refresh_token_expires_at' => Carbon::now()->subDays(4), 'refresh_token' => null]);
        // Assert: Check that the non-expired refresh token is still there
        $this->assertDatabaseHas('users', ['refresh_token_expires_at' => Carbon::now()->addDays(1), 'refresh_token' => 'token2']);
        // Assert: Check that the null refresh_token_expires_at is not affected
        $this->assertDatabaseHas('users', ['refresh_token_expires_at' => null, 'refresh_token' => 'token3']);
    }
}
