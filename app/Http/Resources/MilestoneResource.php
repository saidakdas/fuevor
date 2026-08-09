<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MilestoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'goal_id' => $this->goal_id,
            'title' => $this->title,
            'description' => $this->description,
            'target_date' => $this->target_date?->toDateString(),
            'position' => $this->position,
            'status' => $this->status->value,
            'progress' => $this->progress,
            'completed_at' => $this->completed_at?->toISOString(),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
