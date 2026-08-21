<?php

namespace Tests\Feature;

use App\Models\BetaFeedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BetaEngagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_support_and_feedback_require_authentication(): void
    {
        $this->postJson('/beta/support', ['body' => 'Yardım'])->assertUnauthorized();
        $this->postJson('/beta/feedback', ['rating' => 5, 'comment' => 'Harika'])->assertUnauthorized();
    }

    public function test_user_can_send_a_support_message(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/beta/support', ['body' => 'Planlarımı kaydederken desteğe ihtiyacım var.'])
            ->assertCreated()
            ->assertJsonPath('ticket.status', 'open')
            ->assertJsonPath('ticket.messages.0.is_admin', false);

        $this->assertDatabaseHas('support_tickets', ['user_id' => $user->id, 'status' => 'open']);
        $this->assertDatabaseHas('support_messages', [
            'user_id' => $user->id,
            'is_admin' => false,
            'body' => 'Planlarımı kaydederken desteğe ihtiyacım var.',
        ]);
    }

    public function test_admin_can_reply_and_user_can_see_the_conversation(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $ticket = $user->supportTickets()->create(['status' => 'open']);
        $ticket->messages()->create(['user_id' => $user->id, 'is_admin' => false, 'body' => 'Bir sorum var.']);

        $this->actingAs($admin)
            ->post("/admin/support/{$ticket->id}/reply", ['body' => 'Sorunuzu çözdük.'])
            ->assertRedirect();

        $this->assertDatabaseHas('support_tickets', ['id' => $ticket->id, 'status' => 'answered']);
        $this->assertDatabaseHas('support_messages', [
            'support_ticket_id' => $ticket->id,
            'user_id' => $admin->id,
            'is_admin' => true,
            'body' => 'Sorunuzu çözdük.',
        ]);

        $this->actingAs($user)
            ->get('/beta')
            ->assertInertia(fn (Assert $page) => $page
                ->where('supportTickets.0.status', 'answered')
                ->where('supportTickets.0.messages.1.body', 'Sorunuzu çözdük.')
                ->where('supportTickets.0.messages.1.is_admin', true));
    }

    public function test_regular_user_cannot_reply_as_admin(): void
    {
        $owner = User::factory()->create();
        $ticket = $owner->supportTickets()->create(['status' => 'open']);

        $this->actingAs(User::factory()->create())
            ->post("/admin/support/{$ticket->id}/reply", ['body' => 'Yetkisiz yanıt'])
            ->assertForbidden();

        $this->assertDatabaseCount('support_messages', 0);
    }

    public function test_user_can_submit_beta_feedback_and_admin_can_review_it(): void
    {
        $user = User::factory()->create(['name' => 'Beta Kullanıcısı']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($user)
            ->postJson('/beta/feedback', [
                'rating' => 5,
                'comment' => 'Plan ekranına haftalık özet eklenebilir.',
            ])
            ->assertCreated()
            ->assertJsonPath('feedback.rating', 5);

        $this->assertDatabaseHas('beta_feedback', [
            'user_id' => $user->id,
            'rating' => 5,
            'comment' => 'Plan ekranına haftalık özet eklenebilir.',
        ]);

        $this->actingAs($admin)
            ->get('/admin?section=feedback')
            ->assertInertia(fn (Assert $page) => $page
                ->where('section', 'feedback')
                ->where('feedbackEntries.data.0.user.name', 'Beta Kullanıcısı')
                ->where('feedbackEntries.data.0.rating', 5)
                ->where('stats.average_rating', 5));
    }

    public function test_support_and_feedback_validation_is_enforced(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/beta/support', ['body' => 'x'])->assertUnprocessable()->assertJsonValidationErrors('body');
        $this->actingAs($user)
            ->postJson('/beta/feedback', ['rating' => 6, 'comment' => 'x'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['rating', 'comment']);

        $this->assertDatabaseCount('support_tickets', 0);
        $this->assertDatabaseCount((new BetaFeedback)->getTable(), 0);
    }
}
