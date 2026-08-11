<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
