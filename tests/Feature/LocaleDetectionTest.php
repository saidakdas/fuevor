<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocaleDetectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
    }

    public function test_visitors_in_turkey_see_turkish(): void
    {
        Http::preventStrayRequests();

        $this->withHeader('CF-IPCountry', 'TR')
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'tr'));
    }

    public function test_visitors_outside_turkey_and_northern_cyprus_see_english(): void
    {
        Http::fake([
            'api.country.is/*' => Http::response([
                'country' => 'US',
                'location' => ['time_zone' => 'America/New_York'],
            ]),
        ]);

        $this->withServerVariables(['REMOTE_ADDR' => '8.8.8.8'])
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));
    }

    public function test_northern_cyprus_uses_turkish_while_southern_cyprus_uses_english(): void
    {
        Http::fake([
            'api.country.is/1.1.1.1*' => Http::response([
                'country' => 'CY',
                'location' => ['time_zone' => 'Asia/Famagusta'],
            ]),
            'api.country.is/8.8.4.4*' => Http::response([
                'country' => 'CY',
                'location' => ['time_zone' => 'Asia/Nicosia'],
            ]),
        ]);

        $this->withServerVariables(['REMOTE_ADDR' => '1.1.1.1'])
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'tr'));

        $this->withServerVariables(['REMOTE_ADDR' => '8.8.4.4'])
            ->get('/')
            ->assertInertia(fn (Assert $page) => $page->where('locale', 'en'));
    }

    public function test_waitlist_message_is_english_for_international_visitors(): void
    {
        Http::fake([
            'api.country.is/*' => Http::response([
                'country' => 'GB',
                'location' => ['time_zone' => 'Europe/London'],
            ]),
        ]);

        $this->withServerVariables(['REMOTE_ADDR' => '8.8.8.8'])
            ->post('/register', [
                'name' => 'International User',
                'email' => 'international@example.test',
                'password' => 'password',
                'password_confirmation' => 'password',
            ])
            ->assertRedirect('/')
            ->assertSessionHas(
                'registration_success',
                'Welcome to the family! You have already started moving 1% forward every day. We look forward to meeting you.',
            );
    }

    public function test_public_urls_use_english_ascii_segments_without_locale_prefixes(): void
    {
        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();

            $this->assertDoesNotMatchRegularExpression('/[çğıöşü]/iu', $uri);
            $this->assertDoesNotMatchRegularExpression('#^(tr|en)(/|$)#', $uri);
        }
    }
}
