<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GamePlay extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'player_key',
        'player_name',
        'player_avatar',
        'duration_ms',
    ];
}
