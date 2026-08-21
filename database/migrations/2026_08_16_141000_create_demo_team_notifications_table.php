<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demo_team_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('recipient_username')->index();
            $table->string('actor_username');
            $table->string('type', 40)->index();
            $table->text('message');
            $table->longText('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('acted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_team_notifications');
    }
};
