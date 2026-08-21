<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_plays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('player_key', 191)->index();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamps();

            $table->index(['player_key', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_plays');
    }
};
