<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_login_is_hidden_while_the_user_panel_is_closed(): void
    {
        User::factory()->create([
            'email' => 'mobile@example.test',
        ]);

        $this->postJson('/api/v1/auth/register')->assertNotFound();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'mobile@example.test',
            'password' => 'password',
            'device_name' => 'iPhone',
        ])->assertNotFound();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
