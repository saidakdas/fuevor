<?php

namespace Tests\Feature;

use App\Models\Goal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/admin')->assertRedirect('/login');
    }

    public function test_regular_users_cannot_access_admin_panel(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/admin')
            ->assertForbidden();
    }

    public function test_admin_can_see_user_contact_details_and_goals(): void
    {
        $member = User::factory()->create([
            'name' => 'Ayşe Yılmaz',
            'email' => 'ayse@example.com',
            'phone' => '+90 555 111 22 33',
        ]);
        Goal::factory()->for($member)->create(['title' => 'Yeni kariyer hedefi']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get('/admin?q=ayse@example.com')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/index')
                ->where('users.data.0.name', 'Ayşe Yılmaz')
                ->where('users.data.0.email', 'ayse@example.com')
                ->where('users.data.0.phone', '+90 555 111 22 33')
                ->where('users.data.0.goals.0.title', 'Yeni kariyer hedefi'));
    }

    public function test_admin_is_redirected_to_admin_panel_after_login(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->post('/login', [
            'email' => $admin->email,
            'password' => 'password',
        ])->assertRedirect('/admin');
    }
}
