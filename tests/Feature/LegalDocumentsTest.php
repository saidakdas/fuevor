<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LegalDocumentsTest extends TestCase
{
    public function test_user_agreement_is_public(): void
    {
        $this->get('/kullanici-sozlesmesi')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('legal/show')
                ->where('document', 'terms'));
    }

    public function test_privacy_documents_are_public(): void
    {
        $this->get('/gizlilik')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('legal/show')
                ->where('document', 'privacy'));
    }
}
