<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityGoalIdea extends Model
{
    protected $fillable = ['body', 'user_id', 'parent_id'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(CommunityGoalPost::class, 'community_goal_post_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->oldest();
    }

    public function supporters(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'community_goal_idea_supports')->withTimestamps();
    }
}
