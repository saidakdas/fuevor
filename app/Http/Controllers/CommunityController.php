<?php

namespace App\Http\Controllers;

use App\Enums\GoalStatus;
use App\Models\CommunityBookReview;
use App\Models\CommunityGoalIdea;
use App\Models\CommunityGoalPost;
use App\Models\GameScore;
use App\Models\Goal;
use App\Models\User;
use App\Services\CommunityGameService;
use App\Services\DemoCommunitySeeder;
use App\Services\DemoCommunityUserResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    public function __construct(
        private readonly DemoCommunityUserResolver $demoUsers,
        private readonly DemoCommunitySeeder $demoCommunity,
        private readonly CommunityGameService $game,
    ) {}

    public function __invoke(Request $request): Response
    {
        return Inertia::render('welcome', [
            'registrationSuccess' => $request->session()->get('registration_success'),
            ...$this->feedData($request),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function feedData(Request $request): array
    {
        $demoPreview = $request->routeIs('demo.preview');

        if ($demoPreview) {
            $this->demoCommunity->seed();
        }

        $bestScore = GameScore::query()->orderByDesc('duration_ms')->first();
        $viewerId = $request->user()?->id
            ?? $this->demoUsers->resolve((string) $request->session()->get('demo_community_username'))?->id;
        $posts = CommunityGoalPost::query()
            ->with([
                'user:id,name,email,profession,country,fu_balance,show_fu_publicly,first_builder_number',
                'rootIdeas' => fn ($ideas) => $ideas
                    ->with('user:id,name,email,profession,country,fu_balance,show_fu_publicly,first_builder_number')
                    ->withCount('supporters')
                    ->when($viewerId, fn ($query) => $query->withExists([
                        'supporters as supported_by_viewer' => fn ($supporters) => $supporters->where('users.id', $viewerId),
                    ]))
                    ->with(['replies' => fn ($replies) => $replies
                        ->with('user:id,name,email,profession,country,fu_balance,show_fu_publicly,first_builder_number')
                        ->withCount('supporters')
                        ->when($viewerId, fn ($query) => $query->withExists([
                            'supporters as supported_by_viewer' => fn ($supporters) => $supporters->where('users.id', $viewerId),
                        ]))]),
            ])
            ->withCount(['supporters', 'ideas'])
            ->when($viewerId, fn ($query) => $query->withExists([
                'supporters as supported_by_viewer' => fn ($supporters) => $supporters->where('users.id', $viewerId),
            ]))
            ->latest()
            ->limit(40)
            ->get()
            ->map(fn (CommunityGoalPost $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'description' => $post->description,
                'author' => $post->user->name,
                'authorProfile' => $this->serializeProfile($post->user, $demoPreview),
                'supportCount' => $post->supporters_count,
                'ideaCount' => $post->ideas_count,
                'supportedByViewer' => (bool) ($post->supported_by_viewer ?? false),
                'createdAt' => $post->created_at->toISOString(),
                'ideas' => $post->rootIdeas
                    ->take(8)
                    ->map(fn (CommunityGoalIdea $idea) => $this->serializeIdea($idea, true, $demoPreview))
                    ->values(),
            ]);

        $books = CommunityBookReview::query()
            ->with(['user:id,name', 'replies.user:id,name'])
            ->latest()
            ->limit(300)
            ->get()
            ->groupBy(fn (CommunityBookReview $review) => $review->normalized_title.'|'.$review->normalized_author)
            ->map(fn (Collection $reviews) => $this->serializeBook($reviews))
            ->sortByDesc('latestReviewAt')
            ->values();

        return [
            'communityPosts' => $posts,
            'communityBooks' => $books,
            'firstBuilderNumber' => $demoPreview ? 1 : null,
            'communityGoalStats' => [
                'active' => Goal::query()->where('status', GoalStatus::Active->value)->count(),
                'completed' => Goal::query()->where('status', GoalStatus::Completed->value)->count(),
            ],
            'bestScoreMs' => (int) ($bestScore?->duration_ms ?? 0),
            'bestScorePlayer' => $bestScore?->player_name ? [
                'name' => $bestScore->player_name,
                'avatar' => $bestScore->player_avatar,
            ] : null,
            'gamePlaysRemaining' => $this->game->playsRemainingToday($request),
            'communityGoals' => $request->user()
                ? $request->user()->goals()->latest()->get(['id', 'title'])->map(fn ($goal) => [
                    'id' => $goal->id,
                    'title' => $goal->title,
                ])
                : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeProfile(User $user, bool $demoPreview = false): array
    {
        return $this->demoCommunity->profileFor($user, $demoPreview);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeIdea(CommunityGoalIdea $idea, bool $includeReplies = true, bool $demoPreview = false): array
    {
        return [
            'id' => $idea->id,
            'body' => $idea->body,
            'author' => $idea->user->name,
            'authorProfile' => $this->serializeProfile($idea->user, $demoPreview),
            'supportCount' => (int) $idea->supporters_count,
            'supportedByViewer' => (bool) ($idea->supported_by_viewer ?? false),
            'createdAt' => $idea->created_at->toISOString(),
            'replies' => $includeReplies
                ? $idea->replies->map(fn (CommunityGoalIdea $reply) => $this->serializeIdea($reply, false, $demoPreview))->values()
                : [],
        ];
    }

    /**
     * @param  Collection<int, CommunityBookReview>  $reviews
     * @return array<string, mixed>
     */
    private function serializeBook(Collection $reviews): array
    {
        /** @var CommunityBookReview $latest */
        $latest = $reviews->first();

        $rated = $reviews->whereNotNull('rating');
        $contributions = $reviews->filter(fn (CommunityBookReview $review) => $review->rating !== null || filled($review->review));

        return [
            'key' => $latest->normalized_title.'|'.$latest->normalized_author,
            'title' => $latest->title,
            'author' => $latest->author,
            'readerCount' => $reviews->count(),
            'reviewCount' => $reviews->filter(fn (CommunityBookReview $review) => filled($review->review))->count(),
            'averageRating' => $rated->isEmpty() ? null : round((float) $rated->avg('rating'), 1),
            'latestReviewAt' => $latest->created_at->toISOString(),
            'reviews' => $contributions->map(fn (CommunityBookReview $review) => [
                'id' => $review->id,
                'body' => $review->review,
                'rating' => $review->rating,
                'author' => $review->user->name,
                'createdAt' => $review->created_at->toISOString(),
                'replies' => $review->replies->map(fn ($reply) => [
                    'id' => $reply->id,
                    'body' => $reply->body,
                    'author' => $reply->user->name,
                    'createdAt' => $reply->created_at->toISOString(),
                ])->values(),
            ])->values(),
        ];
    }
}
