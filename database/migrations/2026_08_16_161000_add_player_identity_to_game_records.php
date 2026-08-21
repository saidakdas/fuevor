<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_plays', function (Blueprint $table) {
            $table->string('player_name')->nullable()->after('player_key');
            $table->longText('player_avatar')->nullable()->after('player_name');
        });

        Schema::table('game_scores', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('player_name')->nullable()->after('duration_ms');
            $table->longText('player_avatar')->nullable()->after('player_name');
        });
    }

    public function down(): void
    {
        Schema::table('game_scores', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['player_name', 'player_avatar']);
        });

        Schema::table('game_plays', function (Blueprint $table) {
            $table->dropColumn(['player_name', 'player_avatar']);
        });
    }
};
