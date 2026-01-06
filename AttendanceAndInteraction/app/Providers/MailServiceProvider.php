<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\MailService;


class MailServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
