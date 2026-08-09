<?php

namespace App\Models;

use App\Enums\MilestoneStatus;
use Database\Factories\MilestoneFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Milestone extends Model
{
    /** @use HasFactory<MilestoneFactory> */
    use HasFactory;

    protected $attributes = [
        'status' => 'pending',
        'progress' => 0,
        'position' => 0,
    ];

    protected $fillable = [
        'title', 'description', 'target_date', 'position', 'status', 'progress', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'target_date' => 'date',
            'completed_at' => 'datetime',
            'status' => MilestoneStatus::class,
            'progress' => 'integer',
            'position' => 'integer',
        ];
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->orderBy('position');
    }
}
