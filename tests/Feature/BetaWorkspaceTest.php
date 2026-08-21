<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BetaWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_beta_workspace_requires_authentication(): void
    {
        $this->get('/beta')->assertRedirect('/login');
        $this->patchJson('/beta/state', [])->assertUnauthorized();
    }

    public function test_live_beta_renders_only_for_an_authenticated_user(): void
    {
        $user = User::factory()->create([
            'phone' => '5551112233',
            'profession' => 'Designer',
            'country' => 'TR',
        ]);

        $this->actingAs($user)->get('/beta')->assertInertia(fn (Assert $page) => $page
            ->component('demo/home')
            ->where('betaMode', true)
            ->where('betaState.profile.name', $user->name)
            ->where('betaState.profile.profession', 'Designer')
            ->where('betaState.profile.country', 'TR')
            ->where('betaGoalIds', [])
        );
    }

    public function test_beta_data_is_persisted_and_goals_are_available_to_the_main_release(): void
    {
        $user = User::factory()->create();
        $goalKey = 1780000000000;

        $payload = [
            'goals' => [[
                'id' => $goalKey,
                'title' => 'İlk beta hedefim',
                'gain' => 'Daha sağlıklı olacağım',
                'buildingBlocks' => [
                    ['id' => 1, 'title' => 'İlk adım', 'completed' => true],
                    ['id' => 2, 'title' => 'İkinci adım', 'completed' => false],
                ],
                'deadline' => '2027-01-15',
                'priority' => 'very-important',
                'category' => 'health',
                'createdAt' => $goalKey,
            ]],
            'plans' => [[
                'id' => 1,
                'title' => 'Bugünün planı',
                'range' => 'today',
                'source' => 'independent',
                'completed' => false,
                'createdAt' => $goalKey,
                'scheduledFor' => '2026-08-21',
                'priority' => 'important',
            ]],
            'notes' => [['id' => 1, 'title' => 'Notum', 'content' => 'Kalıcı içerik', 'createdAt' => $goalKey]],
            'books' => [['id' => 1, 'title' => 'Atomik Alışkanlıklar', 'author' => 'James Clear', 'status' => 'reading', 'comment' => '', 'rating' => 0, 'sortOrder' => 0, 'createdAt' => $goalKey]],
            'profile' => [
                'name' => 'Beta Kullanıcısı',
                'username' => 'beta-user',
                'email' => $user->email,
                'phone' => '5551112233',
                'country' => 'TR',
                'profession' => 'Developer',
                'birthDate' => '',
                'about' => '',
                'educations' => [],
                'avatar' => '',
            ],
            'settings' => ['appearance' => 'light', 'language' => 'tr', 'showFuPublicly' => true],
        ];

        $response = $this->actingAs($user)->patchJson('/beta/state', $payload)->assertOk();
        $goalId = $response->json("goalIds.$goalKey");

        $this->assertIsInt($goalId);
        $this->assertDatabaseHas('beta_workspaces', ['user_id' => $user->id]);
        $this->assertDatabaseHas('goals', [
            'id' => $goalId,
            'user_id' => $user->id,
            'beta_key' => (string) $goalKey,
            'title' => 'İlk beta hedefim',
            'priority' => 'high',
            'progress' => 50,
        ]);
        $this->assertDatabaseHas('milestones', ['goal_id' => $goalId, 'beta_key' => '1', 'progress' => 100]);
        $this->assertDatabaseHas('milestones', ['goal_id' => $goalId, 'beta_key' => '2', 'progress' => 0]);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'profession' => 'Developer', 'country' => 'TR']);

        config(['app.user_panel_enabled' => true]);
        $this->actingAs($user)->get('/goals')->assertOk();
        $this->actingAs($user)->get('/beta')->assertInertia(fn (Assert $page) => $page
            ->where('betaState.notes.0.content', 'Kalıcı içerik')
            ->where("betaGoalIds.$goalKey", $goalId)
        );
    }
}
