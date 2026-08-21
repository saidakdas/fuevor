<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\FirstBuilderService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
    public function store(Request $request, FirstBuilderService $firstBuilders): RedirectResponse
    {
        $request->merge([
            'email' => mb_strtolower(trim((string) $request->email)),
            'country' => strtoupper(trim((string) $request->country)),
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'profession' => ['required', 'string', 'max:120'],
            'country' => ['required', 'string', 'size:2', 'regex:/^[A-Z]{2}$/'],
            'gender' => ['required', 'in:female,male,other,prefer-not-to-say'],
            'terms_accepted' => ['accepted'],
            'privacy_acknowledged' => ['accepted'],
        ], [
            'terms_accepted.accepted' => 'Kullanıcı Sözleşmesi ve Kullanım Koşulları kabul edilmelidir.',
            'privacy_acknowledged.accepted' => 'KVKK Aydınlatma Metni ve Gizlilik Politikası okunup onaylanmalıdır.',
        ]);

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

        event(new Registered($user));
        Auth::login($user);
        $request->session()->regenerate();

        return to_route('beta.show');
    }
}
