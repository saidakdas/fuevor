<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

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
        $response->assertRedirect(route('beta.show', absolute: false));
        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '+90 555 111 22 33',
            'profession' => 'Product Designer',
            'country' => 'TR',
            'gender' => 'prefer-not-to-say',
            'terms_version' => '2026-08-21',
            'privacy_version' => '2026-08-21',
        ]);

        $user = $this->app['auth']->user();
        $this->assertNotNull($user->terms_accepted_at);
        $this->assertNotNull($user->privacy_acknowledged_at);
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
}
