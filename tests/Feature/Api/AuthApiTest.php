<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_client_can_register_use_token_and_logout(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Mobil Kullanıcı',
            'email' => 'mobile@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
            'device_name' => 'iPhone',
        ])->assertCreated()->assertJsonPath('data.user.email', 'mobile@example.test');

        $token = $response->json('data.token');
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.email', 'mobile@example.test');
        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
    }
}
