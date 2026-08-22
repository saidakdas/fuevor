<?php

namespace Tests\Feature\Auth;

use App\Mail\EmailVerificationCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
    }

    public function test_early_access_registration_screen_is_public(): void
    {
        $this->get('/register')->assertInertia(fn (Assert $page) => $page->component('auth/register'));
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+90 555 111 22 33',
            'password' => 'password',
            'password_confirmation' => 'password',
            'profession' => 'Product Designer',
            'country' => 'TR',
            'gender' => 'prefer-not-to-say',
            'terms_accepted' => true,
            'privacy_acknowledged' => true,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('verification.notice', absolute: false));
        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+905551112233',
            'profession' => 'Product Designer',
            'country' => 'TR',
            'gender' => 'prefer-not-to-say',
            'terms_version' => '2026-08-21',
            'privacy_version' => '2026-08-21',
        ]);

        $user = $this->app['auth']->user();
        $this->assertSame(1, $user->first_builder_number);
        $this->assertNotNull($user->terms_accepted_at);
        $this->assertNotNull($user->privacy_acknowledged_at);
        $this->assertSame(2, DB::table('first_builder_counters')->where('id', 1)->value('next_number'));
        $this->assertFalse($user->hasVerifiedEmail());
        $this->assertNotNull($user->email_verification_code_hash);
        Mail::assertSent(EmailVerificationCodeMail::class, 1);
    }

    public function test_first_builder_badges_stop_after_number_one_hundred(): void
    {
        User::factory()->create();
        DB::table('first_builder_counters')->where('id', 1)->update(['next_number' => 100]);

        $payload = [
            'name' => 'Yüzüncü Üye',
            'email' => 'builder100@example.com',
            'phone' => '+90 555 111 22 33',
            'password' => 'password',
            'password_confirmation' => 'password',
            'profession' => 'Product Designer',
            'country' => 'TR',
            'gender' => 'prefer-not-to-say',
            'terms_accepted' => true,
            'privacy_acknowledged' => true,
        ];

        $this->post('/register', $payload)->assertRedirect(route('verification.notice', absolute: false));
        $this->assertSame(100, User::query()->where('email', 'builder100@example.com')->value('first_builder_number'));

        Auth::logout();

        $this->post('/register', [
            ...$payload,
            'name' => 'Yüz Birinci Üye',
            'email' => 'builder101@example.com',
            'phone' => '+90 555 111 22 34',
        ])->assertRedirect(route('verification.notice', absolute: false));

        $this->assertNull(User::query()->where('email', 'builder101@example.com')->value('first_builder_number'));
        $this->assertSame(101, DB::table('first_builder_counters')->where('id', 1)->value('next_number'));
    }

    public function test_all_early_access_fields_are_required(): void
    {
        $response = $this->from('/register')->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertGuest();
        $response->assertRedirect('/register')->assertSessionHasErrors([
            'phone',
            'profession',
            'country',
            'gender',
            'terms_accepted',
            'privacy_acknowledged',
        ]);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_legal_acceptances_cannot_be_false(): void
    {
        $response = $this->from('/register')->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+90 555 111 22 33',
            'password' => 'password',
            'password_confirmation' => 'password',
            'profession' => 'Product Designer',
            'country' => 'TR',
            'gender' => 'prefer-not-to-say',
            'terms_accepted' => false,
            'privacy_acknowledged' => false,
        ]);

        $this->assertGuest();
        $response->assertRedirect('/register')->assertSessionHasErrors(['terms_accepted', 'privacy_acknowledged']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_the_same_email_or_phone_cannot_register_twice(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
            'phone' => '+90 (555) 111 22 33',
        ]);

        $payload = [
            'name' => 'Duplicate User',
            'email' => 'existing@example.com',
            'phone' => '+905551112233',
            'password' => 'password',
            'password_confirmation' => 'password',
            'profession' => 'Designer',
            'country' => 'TR',
            'gender' => 'prefer-not-to-say',
            'terms_accepted' => true,
            'privacy_acknowledged' => true,
        ];

        $emailResponse = $this->from('/register')->post('/register', [
            ...$payload,
            'phone' => '+905551112234',
        ]);
        $emailResponse->assertRedirect('/register')->assertSessionHasErrors(['email']);

        $phoneResponse = $this->from('/register')->post('/register', [
            ...$payload,
            'email' => 'new@example.com',
        ]);

        $phoneResponse->assertRedirect('/register')->assertSessionHasErrors(['phone']);
        $this->assertDatabaseCount('users', 1);
        Mail::assertNothingSent();
    }
}
