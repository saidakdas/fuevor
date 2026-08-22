<?php

namespace Tests\Feature\Auth;

use App\Mail\EmailVerificationCodeMail;
use App\Models\User;
use App\Services\EmailVerificationCodeService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_screen_can_be_rendered()
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->get('/verify-email');

        $response->assertStatus(200);
    }

    public function test_email_can_be_verified()
    {
        $user = User::factory()->unverified()->create();

        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $response->assertRedirect(route('beta.show', absolute: false).'?verified=1');
    }

    public function test_email_is_not_verified_with_invalid_hash()
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('wrong-email')]
        );

        $this->actingAs($user)->get($verificationUrl);

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_can_be_verified_with_the_six_digit_code(): void
    {
        Mail::fake();
        Event::fake();
        $user = User::factory()->unverified()->create();
        $code = null;

        app(EmailVerificationCodeService::class)->send($user);

        Mail::assertSent(EmailVerificationCodeMail::class, function (EmailVerificationCodeMail $mail) use (&$code): bool {
            $code = $mail->code;

            return true;
        });

        $response = $this->actingAs($user)->post('/verify-email/code', ['code' => $code]);

        Event::assertDispatched(Verified::class);
        $response->assertRedirect(route('beta.show', absolute: false));
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->assertNull($user->fresh()->email_verification_code_hash);
    }

    public function test_wrong_or_expired_codes_do_not_verify_the_email(): void
    {
        Mail::fake();
        $user = User::factory()->unverified()->create();
        app(EmailVerificationCodeService::class)->send($user);

        $this->actingAs($user)
            ->from('/verify-email')
            ->post('/verify-email/code', ['code' => '999999'])
            ->assertRedirect('/verify-email')
            ->assertSessionHasErrors('code');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
        $this->assertSame(1, $user->fresh()->email_verification_attempts);

        $user->forceFill(['email_verification_code_expires_at' => now()->subMinute()])->save();

        $this->actingAs($user)
            ->from('/verify-email')
            ->post('/verify-email/code', ['code' => '999999'])
            ->assertSessionHasErrors('code');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_unverified_users_cannot_open_the_live_beta(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->get('/beta')
            ->assertRedirect(route('verification.notice', absolute: false));
    }
}
