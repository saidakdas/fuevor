<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemoTeamNotification extends Model
{
    protected $fillable = [
        'recipient_username',
        'actor_username',
        'type',
        'message',
        'data',
        'read_at',
        'acted_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
            'acted_at' => 'datetime',
        ];
    }
}
