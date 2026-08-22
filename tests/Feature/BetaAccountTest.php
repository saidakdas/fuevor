<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BetaAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_beta_account_actions_require_authentication(): void
    {
        $this->delete('/beta/account', ['password' => 'password'])->assertRedirect('/login');
    }

    public function test_current_password_is_required_to_delete_a_beta_account(): void
    {
        config(['app.user_panel_enabled' => false]);

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/beta')
            ->delete('/beta/account', ['password' => 'wrong-password']);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/beta');

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh());
    }

    public function test_user_can_permanently_delete_their_beta_account_and_personal_data(): void
    {
        config(['app.user_panel_enabled' => false]);

        $user = User::factory()->create();
        $now = now();

        DB::table('beta_workspaces')->insert([
            'user_id' => $user->id,
            'goals' => json_encode([['title' => 'Silinecek hedef']]),
            'notes' => json_encode([['content' => 'Silinecek not']]),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('game_plays')->insert([
            'user_id' => $user->id,
            'player_key' => 'user:'.$user->id,
            'player_name' => $user->name,
            'player_avatar' => 'data:image/png;base64,avatar',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('game_scores')->insert([
            'user_id' => $user->id,
            'duration_ms' => 1200,
            'player_name' => $user->name,
            'player_avatar' => 'data:image/png;base64,avatar',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('password_reset_tokens')->insert([
            'email' => $user->email,
            'token' => 'reset-token',
            'created_at' => $now,
        ]);
        DB::table('sessions')->insert([
            'id' => 'another-user-session',
            'user_id' => $user->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Test browser',
            'payload' => 'session-payload',
            'last_activity' => now()->timestamp,
        ]);
        $user->createToken('test-device');

        $response = $this
            ->actingAs($user)
            ->delete('/beta/account', ['password' => 'password']);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('beta_workspaces', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('game_plays', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('game_scores', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        $this->assertDatabaseMissing('sessions', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
    }
}
