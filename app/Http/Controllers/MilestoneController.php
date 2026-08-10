<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReorderRequest;
use App\Http\Requests\StoreMilestoneRequest;
use App\Http\Requests\UpdateMilestoneRequest;
use App\Models\Goal;
use App\Models\Milestone;
use App\Services\MilestoneService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MilestoneController extends Controller
{
    public function __construct(private readonly MilestoneService $service) {}

    public function store(StoreMilestoneRequest $request, Goal $goal): RedirectResponse
    {
        $this->service->create($goal, $request->validated());

        return back()->with('success', __('messages.milestone_created'));
    }

    public function update(UpdateMilestoneRequest $request, Milestone $milestone): RedirectResponse
    {
        $this->service->update($milestone, $request->validated());

        return back()->with('success', __('messages.milestone_updated'));
    }

    public function destroy(Milestone $milestone): RedirectResponse
    {
        Gate::authorize('delete', $milestone);
        $this->service->delete($milestone);

        return back()->with('success', __('messages.milestone_deleted'));
    }

    public function reorder(ReorderRequest $request, Goal $goal): RedirectResponse
    {
        $this->service->reorder($goal, $request->validated('ids'));

        return back()->with('success', __('messages.order_updated'));
    }
}
