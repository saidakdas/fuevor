<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request, EmailVerificationCodeService $verificationCodes): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('beta.show', absolute: false));
        }

        if (! $verificationCodes->canResend($request->user())) {
            return back()->with('status', 'verification-code-throttled');
        }

        try {
            $verificationCodes->send($request->user());
        } catch (\Throwable $exception) {
            report($exception);
            $verificationCodes->clear($request->user());

            return back()->with('status', 'verification-code-failed');
        }

        return back()->with('status', 'verification-code-sent');
    }
}
