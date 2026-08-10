<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_scores', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('duration_ms')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_scores');
    }
};
