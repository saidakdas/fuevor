<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoTeamWorkspaceSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_team_invitation_works_without_an_authenticated_web_session(): void
    {
        $team = $this->teamPayload();
        $team['members'] = [
            ['id' => 1, 'username' => 'saidakdas', 'name' => 'Said Enes Akdaş', 'role' => 'manager', 'joinedAt' => 1],
        ];

        $this->postJson('/demo/team-workspaces', ['username' => 'saidakdas', 'team' => $team])
            ->assertOk();

        $this->postJson('/demo/team-workspaces/1001/invitations', [
            'username' => 'saidakdas',
            'invitedUsername' => 'emretunc',
            'invitedName' => 'Emre Tunç',
        ])
            ->assertCreated()
            ->assertJsonPath('message', 'saidakdas, emretunc kullanıcısını Fuevor Ekibi ekibine eklemek için davetiye gönderdi.');

        $this->getJson('/demo/notifications?username=emretunc')
            ->assertOk()
            ->assertJsonCount(1, 'notifications');
    }

    public function test_team_deletion_is_synchronized_for_all_members(): void
    {
        $manager = User::factory()->create();
        $member = User::factory()->create();
        $team = $this->teamPayload();

        $this->actingAs($manager)
            ->postJson('/demo/team-workspaces', ['username' => 'saidakdas', 'team' => $team])
            ->assertOk()
            ->assertJsonPath('team.name', 'Fuevor Ekibi');

        $this->actingAs($member)
            ->getJson('/demo/team-workspaces?username=test.uye')
            ->assertOk()
            ->assertJsonCount(1, 'teams');

        $this->actingAs($member)
            ->deleteJson('/demo/team-workspaces/1001', ['username' => 'test.uye'])
            ->assertForbidden();

        $this->actingAs($manager)
            ->deleteJson('/demo/team-workspaces/1001', ['username' => 'saidakdas'])
            ->assertNoContent();

        $this->actingAs($member)
            ->getJson('/demo/team-workspaces?username=test.uye')
            ->assertOk()
            ->assertJsonCount(0, 'teams');
    }

    public function test_assistant_cannot_complete_a_block_assigned_to_the_manager(): void
    {
        $manager = User::factory()->create();
        $assistant = User::factory()->create();
        $team = $this->teamPayload();
        $team['members'][] = [
            'id' => 3,
            'username' => 'test.yardimci',
            'name' => 'Test Yönetici Yardımcısı',
            'role' => 'assistant',
            'joinedAt' => 3,
        ];
        $team['goals'] = [[
            'id' => 10,
            'title' => 'Ekip hedefi',
            'gain' => 'Birlikte ilerlemek',
            'category' => 'work',
            'deadline' => '2026-12-31',
            'priority' => 'important',
            'buildingBlocks' => [[
                'id' => 11,
                'title' => 'Yönetici görevi',
                'assigneeId' => 1,
                'completed' => false,
            ]],
            'createdAt' => 1,
        ]];

        $this->actingAs($manager)
            ->postJson('/demo/team-workspaces', ['username' => 'saidakdas', 'team' => $team])
            ->assertOk();

        $team['goals'][0]['buildingBlocks'][0]['completed'] = true;

        $this->actingAs($assistant)
            ->postJson('/demo/team-workspaces', ['username' => 'test.yardimci', 'team' => $team])
            ->assertForbidden();

        $this->actingAs($manager)
            ->postJson('/demo/team-workspaces', ['username' => 'saidakdas', 'team' => $team])
            ->assertOk()
            ->assertJsonPath('team.goals.0.buildingBlocks.0.completed', true);
    }

    public function test_invitation_requires_acceptance_and_assistant_actions_notify_the_manager(): void
    {
        $manager = User::factory()->create();
        $assistant = User::factory()->create();
        $member = User::factory()->create();
        $team = $this->teamPayload();
        $team['name'] = 'Fuevor';
        $team['members'] = [
            ['id' => 1, 'username' => 'saidakdas', 'name' => 'Said Enes Akdaş', 'role' => 'manager', 'joinedAt' => 1],
            ['id' => 2, 'username' => 'test.yardimci', 'name' => 'Test Yardımcı', 'role' => 'assistant', 'joinedAt' => 2],
        ];

        $this->actingAs($manager)
            ->postJson('/demo/team-workspaces', ['username' => 'saidakdas', 'team' => $team])
            ->assertOk();

        $invitationResponse = $this->actingAs($assistant)
            ->postJson('/demo/team-workspaces/1001/invitations', [
                'username' => 'test.yardimci',
                'invitedUsername' => 'test.uye',
                'invitedName' => 'Test Üye',
            ])
            ->assertCreated()
            ->assertJsonPath('message', 'test.yardimci, test.uye kullanıcısını Fuevor ekibine eklemek için davetiye gönderdi.');

        $this->actingAs($member)
            ->getJson('/demo/team-workspaces?username=test.uye')
            ->assertJsonCount(0, 'teams');

        $notificationId = $invitationResponse->json('invitationId');
        $this->actingAs($member)
            ->postJson("/demo/notifications/{$notificationId}/accept", ['username' => 'test.uye'])
            ->assertOk();

        $this->actingAs($member)
            ->getJson('/demo/team-workspaces?username=test.uye')
            ->assertJsonCount(1, 'teams');

        $this->actingAs($assistant)
            ->deleteJson('/demo/team-workspaces/1001/members/test.uye', ['username' => 'test.yardimci'])
            ->assertOk();

        $this->actingAs($manager)
            ->getJson('/demo/notifications?username=saidakdas')
            ->assertOk()
            ->assertJsonFragment([
                'message' => 'test.yardimci, test.uye kullanıcısını Fuevor ekibine eklemek için davetiye gönderdi.',
            ])
            ->assertJsonFragment([
                'message' => 'test.yardimci, test.uye kullanıcısını Fuevor ekibinden çıkardı.',
            ]);
    }

    public function test_existing_team_members_cannot_be_added_directly(): void
    {
        $manager = User::factory()->create();
        $team = $this->teamPayload();
        $team['members'] = [
            ['id' => 1, 'username' => 'saidakdas', 'name' => 'Said Enes Akdaş', 'role' => 'manager', 'joinedAt' => 1],
        ];

        $this->actingAs($manager)
            ->postJson('/demo/team-workspaces', ['username' => 'saidakdas', 'team' => $team])
            ->assertOk();

        $team['members'][] = ['id' => 2, 'username' => 'test.uye', 'name' => 'Test Üye', 'role' => 'member', 'joinedAt' => 2];

        $this->actingAs($manager)
            ->postJson('/demo/team-workspaces', ['username' => 'saidakdas', 'team' => $team])
            ->assertForbidden();

        $this->assertDatabaseMissing('demo_team_workspaces', [
            'workspace_key' => '1001',
            'payload->members->1->username' => 'test.uye',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function teamPayload(): array
    {
        return [
            'id' => 1001,
            'name' => 'Fuevor Ekibi',
            'avatar' => '',
            'inviteCode' => 'FUEVOR-001',
            'creatorUsername' => 'saidakdas',
            'members' => [
                ['id' => 1, 'username' => 'saidakdas', 'name' => 'Said Enes Akdaş', 'role' => 'manager', 'joinedAt' => 1],
                ['id' => 2, 'username' => 'test.uye', 'name' => 'Test Üye', 'role' => 'member', 'joinedAt' => 2],
            ],
            'goals' => [],
            'createdAt' => 1,
        ];
    }
}
