<?php

namespace App\Http\Controllers;

use App\Models\CommunityBookReview;
use App\Models\CommunityGoalIdea;
use App\Models\CommunityGoalPost;
use App\Models\User;
use App\Services\DemoCommunityUserResolver;
use App\Services\RecommendedBookCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CommunityInteractionController extends Controller
{
    public function __construct(private readonly DemoCommunityUserResolver $demoUsers) {}

    public function storeGoal(Request $request): RedirectResponse
    {
        $actor = $this->actor($request);
        $comment = $request->validate(['shortComment' => ['nullable', 'string', 'max:500']])['shortComment'] ?? null;

        if ($request->routeIs('demo.community.*')) {
            $validated = $request->validate([
                'demoGoalId' => ['required', 'string', 'max:80'],
                'goalTitle' => ['required', 'string', 'max:160'],
            ]);
            $actor->communityGoalPosts()->updateOrCreate(
                ['demo_goal_key' => $validated['demoGoalId']],
                ['title' => trim($validated['goalTitle']), 'description' => $comment],
            );

            return back();
        }

        $goalId = $request->validate(['goalId' => ['required', 'integer']])['goalId'];
        $goal = $actor->goals()->findOrFail($goalId);
        $actor->communityGoalPosts()->updateOrCreate(
            ['goal_id' => $goal->id],
            ['title' => $goal->title, 'description' => $comment],
        );

        return back();
    }

    public function toggleSupport(Request $request, CommunityGoalPost $post): RedirectResponse
    {
        $post->supporters()->toggle($this->actor($request)->id);

        return back();
    }

    public function storeIdea(Request $request, CommunityGoalPost $post): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:800'],
            'parentIdeaId' => ['nullable', 'integer'],
        ]);
        $parentId = $validated['parentIdeaId'] ?? null;

        if ($parentId) {
            $post->rootIdeas()->findOrFail($parentId);
        }

        $post->ideas()->create([
            'body' => $validated['body'],
            'parent_id' => $parentId,
            'user_id' => $this->actor($request)->id,
        ]);

        return back();
    }

    public function toggleIdeaSupport(Request $request, CommunityGoalPost $post, CommunityGoalIdea $idea): RedirectResponse
    {
        abort_unless($idea->community_goal_post_id === $post->id, 404);

        $idea->supporters()->toggle($this->actor($request)->id);

        return back();
    }

    public function storeBookReview(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'author' => ['nullable', 'string', 'max:160'],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'review' => ['nullable', 'string', 'max:1200'],
        ]);
        $this->upsertBookReview($this->actor($request), [
            'title' => $validated['title'],
            'author' => $validated['author'] ?? null,
            'rating' => $validated['rating'] ?? null,
            'review' => $validated['review'] ?? null,
        ]);

        return back();
    }

    public function storeBookReviewReply(Request $request, CommunityBookReview $review): RedirectResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:800'],
        ]);

        $review->replies()->create([
            'body' => trim($validated['body']),
            'user_id' => $this->actor($request)->id,
        ]);

        return back();
    }

    public function syncDemoBooks(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'books' => ['present', 'array', 'max:200'],
            'books.*.id' => ['required', 'string', 'max:80'],
            'books.*.title' => ['required', 'string', 'max:200'],
            'books.*.author' => ['nullable', 'string', 'max:160'],
            'books.*.rating' => ['nullable', 'integer', 'between:1,5'],
            'books.*.comment' => ['nullable', 'string', 'max:1200'],
        ]);
        $actor = $this->actor($request);

        DB::transaction(function () use ($actor, $validated): void {
            $keptIds = [];

            foreach ($validated['books'] as $book) {
                $entry = $this->upsertBookReview($actor, [
                    'title' => $book['title'],
                    'author' => $book['author'] ?? null,
                    'rating' => $book['rating'] ?? null,
                    'review' => $book['comment'] ?? null,
                ]);
                $keptIds[] = $entry->id;
            }

            $actor->communityBookReviews()
                ->when($keptIds !== [], fn ($query) => $query->whereNotIn('id', $keptIds))
                ->delete();
        });

        return back();
    }

    /**
     * @param  array{title: string, author?: string|null, rating?: int|null, review?: string|null}  $book
     */
    private function upsertBookReview(User $actor, array $book): CommunityBookReview
    {
        $title = trim($book['title']);
        $author = trim((string) ($book['author'] ?? ''));
        $attributes = [
            'title' => $title,
            'author' => $author ?: null,
            'normalized_title' => Str::lower(Str::squish($title)),
            'normalized_author' => Str::lower(Str::squish($author)),
            'rating' => $book['rating'] ?? null,
            'review' => trim((string) ($book['review'] ?? '')) ?: null,
        ];
        $catalogKey = RecommendedBookCatalog::keyForTitle($title);

        if ($catalogKey) {
            $existing = $actor->communityBookReviews()
                ->get()
                ->first(fn (CommunityBookReview $review) => RecommendedBookCatalog::keyForTitle($review->title) === $catalogKey);

            if ($existing) {
                $existing->update($attributes);

                return $existing;
            }
        }

        return $actor->communityBookReviews()->updateOrCreate(
            [
                'normalized_title' => $attributes['normalized_title'],
                'normalized_author' => $attributes['normalized_author'],
            ],
            $attributes,
        );
    }

    private function actor(Request $request): User
    {
        if (! $request->routeIs('demo.community.*') && $request->user()) {
            return $request->user();
        }

        abort_unless(app()->environment('local', 'testing'), 403);
        $username = $request->validate(['demoUsername' => ['required', 'string', 'max:30']])['demoUsername'];
        $user = $this->demoUsers->resolve($username);
        abort_unless($user, 403);
        $request->session()->put('demo_community_username', $username);

        return $user;
    }
}
