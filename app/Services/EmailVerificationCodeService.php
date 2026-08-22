<?php

namespace App\Services;

use App\Mail\EmailVerificationCodeMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class EmailVerificationCodeService
{
    public const EXPIRES_IN_MINUTES = 10;

    public const RESEND_DELAY_SECONDS = 60;

    public const MAX_ATTEMPTS = 5;

    public function send(User $user): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'email_verification_code_hash' => Hash::make($code),
            'email_verification_code_expires_at' => now()->addMinutes(self::EXPIRES_IN_MINUTES),
            'email_verification_code_sent_at' => now(),
            'email_verification_attempts' => 0,
        ])->save();

        Mail::to($user->email, $user->name)->send(new EmailVerificationCodeMail(
            $code,
            self::EXPIRES_IN_MINUTES,
            app()->getLocale(),
        ));
    }

    public function canResend(User $user): bool
    {
        return $user->email_verification_code_sent_at === null
            || $user->email_verification_code_sent_at->lte(now()->subSeconds(self::RESEND_DELAY_SECONDS));
    }

    public function matches(User $user, string $code): bool
    {
        return filled($user->email_verification_code_hash)
            && $user->email_verification_code_expires_at?->isFuture()
            && $user->email_verification_attempts < self::MAX_ATTEMPTS
            && Hash::check($code, $user->email_verification_code_hash);
    }

    public function clear(User $user): void
    {
        $user->forceFill([
            'email_verification_code_hash' => null,
            'email_verification_code_expires_at' => null,
            'email_verification_code_sent_at' => null,
            'email_verification_attempts' => 0,
        ])->save();
    }
}
