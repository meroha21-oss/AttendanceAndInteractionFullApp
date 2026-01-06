<?php

namespace App\Traits;

trait SerializesLocalDates
{
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->setTimezone(new \DateTimeZone(config('app.timezone')))
            ->format('Y-m-d H:i:s');
    }
}
