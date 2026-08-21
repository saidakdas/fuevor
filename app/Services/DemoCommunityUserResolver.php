<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

class DemoCommunityUserResolver
{
    public function __construct(private readonly DemoCommunitySeeder $demoCommunity) {}

    public function resolve(string $username): ?User
    {
        $normalized = str($username)->trim()->ltrim('@')->lower()->toString();
        if (! preg_match('/^[\pL\pN._-]{3,30}$/u', $normalized)) {
            return null;
        }

        $profile = collect($this->demoCommunity->profiles())
            ->first(fn (array $candidate): bool => $candidate['username'] === $normalized)
            ?? match ($normalized) {
                'saidakdas' => ['name' => 'Said Enes Akdaş', 'email' => 'test.yonetici@fuevor.local'],
                'test.yardimci' => ['name' => 'Test Yönetici Yardımcısı', 'email' => 'test.yardimci@fuevor.local'],
                'test.uye' => ['name' => 'Test Üye', 'email' => 'test.uye@fuevor.local'],
                default => [
                    'name' => Str::of($normalized)->replace(['.', '_', '-'], ' ')->headline()->toString(),
                    'email' => $normalized.'@demo.fuevor.local',
                ],
            };

        return User::query()->firstOrCreate(
            ['email' => $profile['email']],
            [
                'name' => $profile['name'],
                'password' => Str::random(40),
            ],
        );
    }
}
