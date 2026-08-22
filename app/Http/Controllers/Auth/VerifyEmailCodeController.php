<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\EmailVerificationCodeService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class VerifyEmailCodeController extends Controller
{
    public function __invoke(Request $request, EmailVerificationCodeService $verificationCodes): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'digits:6'],
        ], [
            'code.required' => 'E-postana gönderilen doğrulama kodunu gir.',
            'code.digits' => 'Doğrulama kodu 6 haneli olmalıdır.',
        ]);

        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return to_route('beta.show');
        }

        if ($user->email_verification_code_expires_at === null
            || $user->email_verification_code_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'code' => 'Kodun süresi dolmuş. Yeni bir doğrulama kodu iste.',
            ]);
        }

        if ($user->email_verification_attempts >= EmailVerificationCodeService::MAX_ATTEMPTS) {
            throw ValidationException::withMessages([
                'code' => 'Çok fazla hatalı deneme yapıldı. Yeni bir doğrulama kodu iste.',
            ]);
        }

        if (! $verificationCodes->matches($user, $validated['code'])) {
            $user->increment('email_verification_attempts');

            throw ValidationException::withMessages([
                'code' => 'Doğrulama kodu hatalı.',
            ]);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        $verificationCodes->clear($user);

        return to_route('beta.show')->with('status', 'email-verified');
    }
}
