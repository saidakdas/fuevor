<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DemoHomeTest extends TestCase
{
    use RefreshDatabase;

    public function test_primary_domain_keeps_the_existing_welcome_page(): void
    {
        $this->get('http://fuevor.com/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('welcome'));
    }

    public function test_demo_preview_is_available_during_development(): void
    {
        $this->get('/demo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('demo/home'));
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
