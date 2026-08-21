<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class FirstBuilderService
{
    public const LIMIT = 100;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function register(array $attributes): User
    {
        return DB::transaction(function () use ($attributes): User {
            $counter = DB::table('first_builder_counters')
                ->where('id', 1)
                ->lockForUpdate()
                ->first();

            $number = $counter && $counter->next_number <= self::LIMIT
                ? (int) $counter->next_number
                : null;

            if ($number !== null) {
                DB::table('first_builder_counters')
                    ->where('id', 1)
                    ->update(['next_number' => $number + 1]);
            }

            $user = new User;
            $user->forceFill([
                ...$attributes,
                'first_builder_number' => $number,
            ])->save();

            return $user;
        }, 3);
    }
}
