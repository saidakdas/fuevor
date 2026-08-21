<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemoTeamWorkspace extends Model
{
    protected $fillable = [
        'workspace_key',
        'invite_code',
        'creator_username',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}
