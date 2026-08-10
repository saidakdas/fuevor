<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_standalone_registration_screen_is_not_public(): void
    {
        $this->get('/register')->assertNotFound();
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertGuest();
        $response
            ->assertRedirect(route('home', absolute: false))
            ->assertSessionHas(
                'registration_success',
                'Aramıza Hoşgeldin! Her Gün %1 İleri Gitmeye Başladın Bile. Sabırla Sizinle Buluşmayı Bekliyoruz.',
            );
        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where(
                'registrationSuccess',
                'Aramıza Hoşgeldin! Her Gün %1 İleri Gitmeye Başladın Bile. Sabırla Sizinle Buluşmayı Bekliyoruz.',
            ));
        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
    }

    public function test_an_existing_waitlist_session_is_closed_without_redirecting_to_the_hidden_panel(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/register', [
            'name' => $user->name,
            'email' => $user->email,
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertGuest();
        $response
            ->assertRedirect(route('home', absolute: false))
            ->assertSessionHas(
                'registration_success',
                'Aramıza Hoşgeldin! Her Gün %1 İleri Gitmeye Başladın Bile. Sabırla Sizinle Buluşmayı Bekliyoruz.',
            );
        $this->assertDatabaseCount('users', 1);
    }
}
