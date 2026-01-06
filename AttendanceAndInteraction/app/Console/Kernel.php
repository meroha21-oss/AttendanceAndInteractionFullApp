<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */

     protected $commands = [
        \App\Console\Commands\DeleteExpiredTokens::class,
        \App\Console\Commands\AutoUpdateLecturesStatus::class,

    ];

    protected function schedule(\Illuminate\Console\Scheduling\Schedule $schedule)
    {
        $schedule->command('lectures:auto-update-status')->everyMinute();
        $schedule->command('lectures:send-reminders')->everyMinute();
    }

    // protected function schedule(Schedule $schedule): void
    // {

    //     $schedule->command('tokens:delete-expired')->daily();

    // }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
