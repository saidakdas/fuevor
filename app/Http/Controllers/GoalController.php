<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGoalRequest;
use App\Http\Requests\UpdateGoalRequest;
use App\Http\Resources\GoalResource;
use App\Models\Goal;
use App\Repositories\GoalRepository;
use App\Services\GoalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GoalController extends Controller
{
    public function __construct(private readonly GoalService $service, private readonly GoalRepository $repository) {}

    public function index(Request $request): Response
    {
        return Inertia::render('goals/index', [
            'goals' => GoalResource::collection($this->repository->forUser($request->user()))->resolve(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('goals/create');
    }

    public function store(StoreGoalRequest $request): RedirectResponse
    {
        $goal = $this->service->create($request->user(), $request->validated());

        return to_route('goals.show', $goal)->with('success', 'Hedef oluşturuldu.');
    }

    public function show(Goal $goal): Response
    {
        Gate::authorize('view', $goal);

        return Inertia::render('goals/show', [
            'goal' => (new GoalResource($goal->load('milestones.tasks')))->resolve(request()),
        ]);
    }

    public function edit(Goal $goal): Response
    {
        Gate::authorize('update', $goal);

        return Inertia::render('goals/edit', ['goal' => (new GoalResource($goal))->resolve(request())]);
    }

    public function update(UpdateGoalRequest $request, Goal $goal): RedirectResponse
    {
        $this->service->update($goal, $request->validated());

        return to_route('goals.show', $goal)->with('success', 'Hedef güncellendi.');
    }

    public function destroy(Goal $goal): RedirectResponse
    {
        Gate::authorize('delete', $goal);
        $this->service->delete($goal);

        return to_route('goals.index')->with('success', 'Hedef silindi.');
    }
}
