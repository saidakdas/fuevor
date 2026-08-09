<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GoalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'start_date' => $this->start_date->toDateString(),
            'target_date' => $this->target_date->toDateString(),
            'status' => $this->status->value,
            'priority' => $this->priority->value,
            'motivation' => $this->motivation,
            'reward' => $this->reward,
            'progress' => $this->progress,
            'completed_at' => $this->completed_at?->toISOString(),
            'milestones_count' => $this->whenCounted('milestones'),
            'milestones' => MilestoneResource::collection($this->whenLoaded('milestones')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
