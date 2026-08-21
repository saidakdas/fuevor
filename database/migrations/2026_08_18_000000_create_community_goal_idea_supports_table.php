<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('community_goal_idea_supports')) {
            Schema::create('community_goal_idea_supports', function (Blueprint $table) {
                $table->id();
                $table->foreignId('community_goal_idea_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['community_goal_idea_id', 'user_id'], 'community_idea_support_user_unique');
            });

            return;
        }

        if (! Schema::hasIndex('community_goal_idea_supports', 'community_idea_support_user_unique')) {
            Schema::table('community_goal_idea_supports', function (Blueprint $table) {
                $table->unique(['community_goal_idea_id', 'user_id'], 'community_idea_support_user_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_goal_idea_supports');
    }
};
