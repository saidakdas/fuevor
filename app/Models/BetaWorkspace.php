<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BetaWorkspace extends Model
{
    protected $fillable = ['goals', 'plans', 'notes', 'books', 'profile', 'settings'];

    protected function casts(): array
    {
        return [
            'goals' => 'array',
            'plans' => 'array',
            'notes' => 'array',
            'books' => 'array',
            'profile' => 'array',
            'settings' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
