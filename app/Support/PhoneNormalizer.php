<?php

namespace App\Support;

use App\Models\User;

final class PhoneNormalizer
{
    public static function normalize(mixed $phone): ?string
    {
        $value = trim((string) $phone);

        if ($value === '') {
            return null;
        }

        $international = str_starts_with($value, '+') || str_starts_with($value, '00');
        $digits = preg_replace('/\D+/', '', $value) ?? '';

        if (str_starts_with($value, '00')) {
            $digits = substr($digits, 2);
        }

        return $international ? '+'.$digits : $digits;
    }

    public static function isInUse(?string $phone, ?int $exceptUserId = null): bool
    {
        if ($phone === null) {
            return false;
        }

        return User::query()
            ->whereNotNull('phone')
            ->when($exceptUserId !== null, fn ($query) => $query->whereKeyNot($exceptUserId))
            ->pluck('phone')
            ->contains(fn (string $existingPhone): bool => self::normalize($existingPhone) === $phone);
    }
}
