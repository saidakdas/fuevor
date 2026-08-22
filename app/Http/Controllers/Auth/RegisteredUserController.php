<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\EmailVerificationCodeService;
use App\Services\FirstBuilderService;
use App\Support\PhoneNormalizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    private const LEGAL_DOCUMENT_VERSION = '2026-08-21';

    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(
        Request $request,
        FirstBuilderService $firstBuilders,
        EmailVerificationCodeService $verificationCodes,
    ): RedirectResponse {
        $request->merge([
            'email' => mb_strtolower(trim((string) $request->email)),
            'phone' => PhoneNormalizer::normalize($request->phone),
            'country' => strtoupper(trim((string) $request->country)),
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => ['required', 'string', 'regex:/^\+?[0-9]{7,20}$/', Rule::unique(User::class)],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'profession' => ['required', 'string', 'max:120'],
            'country' => ['required', 'string', 'size:2', 'regex:/^[A-Z]{2}$/'],
            'gender' => ['required', 'in:female,male,other,prefer-not-to-say'],
            'terms_accepted' => ['accepted'],
            'privacy_acknowledged' => ['accepted'],
        ], [
            'terms_accepted.accepted' => 'Kullanıcı Sözleşmesi ve Kullanım Koşulları kabul edilmelidir.',
            'privacy_acknowledged.accepted' => 'KVKK Aydınlatma Metni ve Gizlilik Politikası okunup onaylanmalıdır.',
            'phone.regex' => 'Geçerli bir telefon numarası girilmelidir.',
            'phone.unique' => 'Bu telefon numarasıyla daha önce kayıt olunmuş.',
            'email.unique' => 'Bu e-posta adresiyle daha önce kayıt olunmuş.',
        ]);

        if (PhoneNormalizer::isInUse($request->phone)) {
            throw ValidationException::withMessages([
                'phone' => 'Bu telefon numarasıyla daha önce kayıt olunmuş.',
            ]);
        }

        $acceptedAt = now();

        $user = $firstBuilders->register([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'profession' => $request->profession,
            'country' => $request->country,
            'gender' => $request->gender,
            'early_access_at' => now(),
            'terms_accepted_at' => $acceptedAt,
            'terms_version' => self::LEGAL_DOCUMENT_VERSION,
            'privacy_acknowledged_at' => $acceptedAt,
            'privacy_version' => self::LEGAL_DOCUMENT_VERSION,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        try {
            $verificationCodes->send($user);
        } catch (\Throwable $exception) {
            report($exception);
            $verificationCodes->clear($user);

            return to_route('verification.notice')->with('status', 'verification-code-failed');
        }

        return to_route('verification.notice')->with('status', 'verification-code-sent');
    }
}
