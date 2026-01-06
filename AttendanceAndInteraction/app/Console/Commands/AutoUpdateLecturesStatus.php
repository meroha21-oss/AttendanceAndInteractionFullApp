<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Lecture;
use Carbon\Carbon;

class AutoUpdateLecturesStatus extends Command
{
    protected $signature = 'lectures:auto-update-status';
    protected $description = 'Auto cancel scheduled lectures that passed, and auto end running lectures that ended.';

    public function handle()
    {
        $now = Carbon::now();

        // 1) scheduled + lecture time end => cancelled
        $cancelled = Lecture::where('status', 'scheduled')
            ->where('ends_at', '<', $now)
            ->update(['status' => 'cancelled']);

        // 2) running + lecture time end => ended
        $ended = Lecture::where('status', 'running')
            ->where('ends_at', '<', $now)
            ->update([
                'status' => 'ended',
                'ended_at' => $now
            ]);

        $this->info("Auto updated lectures. Cancelled: {$cancelled}, Ended: {$ended}");
        return 0;
    }
}
