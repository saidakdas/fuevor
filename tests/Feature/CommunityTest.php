<?php

namespace Tests\Feature;

use App\Enums\GoalStatus;
use App\Models\CommunityGoalPost;
use App\Models\Goal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CommunityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Inertia::withoutSsr('*');
    }

    public function test_homepage_displays_public_goals_and_groups_book_reviews_by_title(): void
    {
        $firstUser = User::factory()->create(['name' => 'Birinci Okur', 'first_builder_number' => 3]);
        $secondUser = User::factory()->create(['name' => 'İkinci Okur']);
        Goal::factory()->for($firstUser)->create(['status' => GoalStatus::Active]);
        Goal::factory()->for($secondUser)->create(['status' => GoalStatus::Completed, 'progress' => 100]);
        Goal::factory()->for($secondUser)->create(['status' => GoalStatus::Paused]);
        $post = $firstUser->communityGoalPosts()->create([
            'title' => 'Yeni bir dil öğrenmek',
            'description' => 'Yıl sonuna kadar B2 seviyesine gelmek.',
        ]);
        $post->ideas()->create(['user_id' => $secondUser->id, 'body' => 'Her gün konuşma pratiği yap.']);
        $post->supporters()->attach($secondUser->id);

        $firstUser->communityBookReviews()->create($this->reviewPayload('Atomik Alışkanlıklar', 5, 'Uygulanabilir önerileri çok iyi.'));
        $secondUser->communityBookReviews()->create($this->reviewPayload('  atomik alışkanlıklar ', 3, 'Bazı bölümleri tekrar ediyor.'));

        $this->get('/topluluk')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->has('communityPosts', 1)
                ->where('communityPosts.0.title', 'Yeni bir dil öğrenmek')
                ->where('communityPosts.0.supportCount', 1)
                ->where('communityPosts.0.ideaCount', 1)
                ->where('communityPosts.0.authorProfile.firstBuilderNumber', 3)
                ->where('communityGoalStats.active', 1)
                ->where('communityGoalStats.completed', 1)
                ->has('communityBooks', 0)
                ->has('recommendedBooks', 5)
                ->where('recommendedBooks.2.key', 'recommended:atomic-habits')
                ->where('recommendedBooks.2.localized.tr.title', 'Atomik Alışkanlıklar')
                ->where('recommendedBooks.2.localized.en.title', 'Atomic Habits')
                ->where('recommendedBooks.2.reviewCount', 2)
                ->where('recommendedBooks.2.averageRating', 4));
    }

    public function test_recommended_book_reviews_are_grouped_across_turkish_and_english_titles(): void
    {
        $turkishReader = User::factory()->create();
        $englishReader = User::factory()->create();

        $turkishReader->communityBookReviews()->create($this->reviewPayload('Atomik Alışkanlıklar', 5, 'Sistem yaklaşımı çok iyi.'));
        $englishReader->communityBookReviews()->create($this->reviewPayload('Atomic Habits', 4, 'Practical and clear.'));

        $this->get('/topluluk')
            ->assertInertia(fn (Assert $page) => $page
                ->has('communityBooks', 0)
                ->where('recommendedBooks.2.readerCount', 2)
                ->where('recommendedBooks.2.reviewCount', 2)
                ->has('recommendedBooks.2.reviews', 2));
    }

    public function test_one_reader_has_one_review_for_both_localized_titles_of_a_recommended_book(): void
    {
        $reader = User::factory()->create();

        $this->actingAs($reader)->post('/community/books/reviews', [
            'title' => 'Atomik Alışkanlıklar',
            'author' => 'James Clear',
            'rating' => 5,
            'review' => 'İlk yorum.',
        ])->assertRedirect();
        $this->actingAs($reader)->post('/community/books/reviews', [
            'title' => 'Atomic Habits',
            'author' => 'James Clear',
            'rating' => 4,
            'review' => 'Updated review.',
        ])->assertRedirect();

        $this->assertDatabaseCount('community_book_reviews', 1);
        $this->assertDatabaseHas('community_book_reviews', [
            'user_id' => $reader->id,
            'title' => 'Atomic Habits',
            'rating' => 4,
            'review' => 'Updated review.',
        ]);
    }

    public function test_authenticated_users_can_share_support_idea_and_review(): void
    {
        $owner = User::factory()->create();
        $participant = User::factory()->create();
        $goal = Goal::factory()->for($owner)->create(['title' => 'Maraton koşmak']);

        $this->actingAs($owner)
            ->post('/community/goals', ['goalId' => $goal->id, 'shortComment' => 'İlk 42 kilometrem.'])
            ->assertRedirect();

        $post = CommunityGoalPost::query()->firstOrFail();
        $this->assertSame($goal->id, $post->goal_id);
        $this->assertSame('Maraton koşmak', $post->title);
        $this->actingAs($participant)->post("/community/goals/{$post->id}/support")->assertRedirect();
        $this->actingAs($participant)->post("/community/goals/{$post->id}/ideas", ['body' => 'Önce haftalık mesafeni kademeli artır.'])->assertRedirect();
        $ideaId = $post->ideas()->firstOrFail()->id;
        $this->actingAs($owner)->post("/community/goals/{$post->id}/ideas", [
            'body' => 'Bu öneriyi haftalık planıma ekledim.',
            'parentIdeaId' => $ideaId,
        ])->assertRedirect();
        $this->actingAs($participant)->post('/community/books/reviews', [
            'title' => 'Dönüşüm',
            'author' => 'Franz Kafka',
            'rating' => 5,
            'review' => 'Kısa ama çok katmanlı bir kitap.',
        ])->assertRedirect();
        $this->actingAs($participant)->post('/community/books/reviews', [
            'title' => '  dönüşüm ',
            'author' => 'Franz Kafka',
            'rating' => 4,
            'review' => 'İkinci okumamdan sonra güncel yorumum.',
        ])->assertRedirect();

        $this->assertDatabaseHas('community_goal_supports', ['community_goal_post_id' => $post->id, 'user_id' => $participant->id]);
        $this->assertDatabaseHas('community_goal_ideas', ['community_goal_post_id' => $post->id, 'body' => 'Önce haftalık mesafeni kademeli artır.']);
        $this->assertDatabaseHas('community_goal_ideas', ['parent_id' => $ideaId, 'body' => 'Bu öneriyi haftalık planıma ekledim.']);
        $this->assertDatabaseHas('community_book_reviews', ['normalized_title' => 'dönüşüm', 'rating' => 4]);
        $this->assertDatabaseCount('community_book_reviews', 1);
    }

    public function test_support_is_unique_and_can_be_removed(): void
    {
        $owner = User::factory()->create();
        $supporter = User::factory()->create();
        $post = $owner->communityGoalPosts()->create(['title' => 'Bir ürün çıkarmak']);

        $this->actingAs($supporter)->post("/community/goals/{$post->id}/support")->assertRedirect();
        $this->assertSame(1, DB::table('community_goal_supports')->count());

        $this->actingAs($supporter)->post("/community/goals/{$post->id}/support")->assertRedirect();
        $this->assertSame(0, DB::table('community_goal_supports')->count());
    }

    public function test_authenticated_users_can_reply_to_public_book_reviews(): void
    {
        $reader = User::factory()->create(['name' => 'Kitap Okuru']);
        $responder = User::factory()->create(['name' => 'Fikir Sahibi']);
        $review = $reader->communityBookReviews()->create(
            $this->reviewPayload('İnsan Ne ile Yaşar', 5, 'Kısa ve etkileyici.'),
        );

        $this->actingAs($responder)
            ->post("/community/books/reviews/{$review->id}/replies", [
                'body' => 'Ben de özellikle son öyküyü çok sevdim.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('community_book_review_replies', [
            'community_book_review_id' => $review->id,
            'user_id' => $responder->id,
            'body' => 'Ben de özellikle son öyküyü çok sevdim.',
        ]);

        $this->get('/topluluk')
            ->assertInertia(fn (Assert $page) => $page
                ->has('communityBooks.0.reviews.0.replies', 1)
                ->where('communityBooks.0.reviews.0.replies.0.author', 'Fikir Sahibi')
                ->where('communityBooks.0.reviews.0.replies.0.body', 'Ben de özellikle son öyküyü çok sevdim.'));
    }

    public function test_guests_cannot_create_community_content(): void
    {
        $this->post('/community/goals', ['title' => 'Yetkisiz hedef'])
            ->assertRedirect('/login');
    }

    public function test_demo_profile_can_use_community_without_a_second_login(): void
    {
        $demoUser = User::factory()->create([
            'name' => 'Said Enes Akdaş',
            'email' => 'test.yonetici@fuevor.local',
        ]);

        $this->post('/demo/community/goals', [
            'demoUsername' => 'saidakdas',
            'demoGoalId' => '42',
            'goalTitle' => 'Demo topluluk hedefi',
            'shortComment' => 'Demo oturumu yeniden giriş istemeden paylaşabilmeli.',
        ])->assertRedirect();

        $post = CommunityGoalPost::query()->firstOrFail();
        $this->assertSame($demoUser->id, $post->user_id);

        $this->post("/demo/community/goals/{$post->id}/support", ['demoUsername' => 'saidakdas'])
            ->assertRedirect();
        $this->post("/demo/community/goals/{$post->id}/ideas", [
            'demoUsername' => 'saidakdas',
            'body' => 'Demo profilinden bir fikir.',
        ])->assertRedirect();

        $this->assertDatabaseHas('community_goal_supports', ['community_goal_post_id' => $post->id, 'user_id' => $demoUser->id]);
        $this->assertDatabaseHas('community_goal_ideas', ['community_goal_post_id' => $post->id, 'user_id' => $demoUser->id]);
    }

    public function test_custom_local_demo_profile_can_enter_community_without_a_forbidden_response(): void
    {
        $this->post('/demo/community/books/sync', [
            'demoUsername' => 'ozel.kullanici',
            'books' => [],
        ])->assertRedirect();

        $this->assertDatabaseHas('users', [
            'name' => 'Ozel Kullanici',
            'email' => 'ozel.kullanici@demo.fuevor.local',
        ]);
    }

    public function test_finished_demo_books_are_public_even_without_reviews_and_group_by_title_and_author(): void
    {
        User::factory()->create(['email' => 'test.yonetici@fuevor.local']);
        User::factory()->create(['email' => 'test.uye@fuevor.local']);

        $this->post('/demo/community/books/sync', [
            'demoUsername' => 'saidakdas',
            'books' => [
                ['id' => '1', 'title' => 'Dönüşüm', 'author' => 'Franz Kafka', 'rating' => null, 'comment' => ''],
                ['id' => '2', 'title' => 'Dönüşüm', 'author' => 'Başka Yazar', 'rating' => 4, 'comment' => 'Farklı bir kitap.'],
            ],
        ])->assertRedirect();
        $this->post('/demo/community/books/sync', [
            'demoUsername' => 'test.uye',
            'books' => [
                ['id' => '7', 'title' => ' dönüşüm ', 'author' => ' Franz Kafka ', 'rating' => 5, 'comment' => 'Çarpıcıydı.'],
            ],
        ])->assertRedirect();

        $this->get('/topluluk')
            ->assertInertia(fn (Assert $page) => $page
                ->has('communityBooks', 2)
                ->where('communityBooks.0.readerCount', 2)
                ->where('communityBooks.0.reviewCount', 1)
                ->where('communityBooks.0.averageRating', 5));
    }

    /**
     * @return array<string, mixed>
     */
    private function reviewPayload(string $title, int $rating, string $review): array
    {
        return [
            'title' => trim($title),
            'normalized_title' => mb_strtolower(trim(preg_replace('/\s+/', ' ', $title))),
            'author' => null,
            'normalized_author' => '',
            'rating' => $rating,
            'review' => $review,
        ];
    }
}
