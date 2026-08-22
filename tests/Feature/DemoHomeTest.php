<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\DemoCommunitySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DemoHomeTest extends TestCase
{
    use RefreshDatabase;

    public function test_primary_domain_uses_the_new_landing_page(): void
    {
        $this->get('http://fuevor.com/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('landing'));
    }

    public function test_explore_workspace_is_prefilled_and_does_not_touch_live_data(): void
    {
        User::factory()->create();
        $userCount = User::query()->count();
        $goalCount = DB::table('goals')->count();
        $badgeCounter = DB::table('first_builder_counters')->where('id', 1)->value('next_number');

        $this->get('/kesfet')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('demo/home')
                ->where('exploreMode', true)
                ->where('firstBuilderNumber', 7)
                ->has('exploreState.goals', 4)
                ->has('exploreState.plans', 4)
                ->has('communityPosts', 5)
                ->has('communityBooks', 1)
                ->has('recommendedBooks', 5)
                ->where('recommendedBooks.2.key', 'recommended:atomic-habits')
                ->where('recommendedBooks.2.reviewCount', 2));

        $this->assertSame($userCount, User::query()->count());
        $this->assertSame($goalCount, DB::table('goals')->count());
        $this->assertSame($badgeCounter, DB::table('first_builder_counters')->where('id', 1)->value('next_number'));
    }

    public function test_demo_preview_is_available_during_development_without_changing_live_badge_numbers(): void
    {
        $demoMember = User::factory()->create(['email' => 'community.ece@fuevor.local']);

        $this->get('/demo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('demo/home')
                ->where('firstBuilderNumber', 1)
                ->has('communityPosts')
                ->has('communityBooks')
                ->has('recommendedBooks', 5));

        $this->assertSame(2, app(DemoCommunitySeeder::class)->profileFor($demoMember, true)['firstBuilderNumber']);
        $this->assertNull(app(DemoCommunitySeeder::class)->profileFor($demoMember)['firstBuilderNumber']);
        $this->assertSame(1, DB::table('first_builder_counters')->where('id', 1)->value('next_number'));
        $this->assertSame(0, User::query()->whereNotNull('first_builder_number')->count());
    }

    public function test_demo_can_search_the_worldwide_university_directory(): void
    {
        Http::fake([
            'universities.hipolabs.com/*' => Http::response([
                [
                    'name' => 'Istanbul Technical University',
                    'country' => 'Turkiye',
                    'alpha_two_code' => 'tr',
                ],
                [
                    'name' => 'Istanbul Technical University',
                    'country' => 'Turkiye',
                    'alpha_two_code' => 'tr',
                ],
            ]),
        ]);

        $this->getJson('/demo/universities?q=istanbul')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.name', 'Istanbul Technical University')
            ->assertJsonPath('0.country', 'Turkiye')
            ->assertJsonPath('0.alpha_two_code', 'TR');

        Http::assertSent(fn (Request $request) => $request->url() === 'http://universities.hipolabs.com/search?name=istanbul');
    }

    public function test_short_university_queries_do_not_call_the_remote_directory(): void
    {
        Http::fake();

        $this->getJson('/demo/universities?q=a')
            ->assertOk()
            ->assertExactJson([]);

        Http::assertNothingSent();
    }
}
