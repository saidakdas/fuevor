<?php

namespace App\Models;

use App\Enums\Priority;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    protected $attributes = [
        'priority' => 'medium',
        'is_completed' => false,
        'position' => 0,
    ];

    protected $fillable = [
        'title', 'description', 'due_date', 'priority', 'is_completed', 'completed_at', 'position',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'priority' => Priority::class,
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
            'position' => 'integer',
        ];
    }

    public function milestone(): BelongsTo
    {
        return $this->belongsTo(Milestone::class);
    }
}
