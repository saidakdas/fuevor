<?php

namespace App\Models;

use App\Enums\GoalStatus;
use App\Enums\Priority;
use Database\Factories\GoalFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Goal extends Model
{
    /** @use HasFactory<GoalFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'active',
        'priority' => 'medium',
        'progress' => 0,
    ];

    protected $fillable = [
        'beta_key', 'title', 'description', 'start_date', 'target_date', 'status', 'priority',
        'motivation', 'reward', 'progress', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'target_date' => 'date',
            'completed_at' => 'datetime',
            'fu_awarded_at' => 'datetime',
            'status' => GoalStatus::class,
            'priority' => Priority::class,
            'progress' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class)->orderBy('position');
    }
}
