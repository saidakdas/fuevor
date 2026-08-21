<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityGoalPost extends Model
{
    protected $fillable = ['goal_id', 'demo_goal_key', 'title', 'description'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }

    public function supporters(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'community_goal_supports')->withTimestamps();
    }

    public function ideas(): HasMany
    {
        return $this->hasMany(CommunityGoalIdea::class)->latest();
    }

    public function rootIdeas(): HasMany
    {
        return $this->hasMany(CommunityGoalIdea::class)->whereNull('parent_id')->latest();
    }
}
