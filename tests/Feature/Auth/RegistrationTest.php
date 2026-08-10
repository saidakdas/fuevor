<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get('/register')->assertOk();
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
}
