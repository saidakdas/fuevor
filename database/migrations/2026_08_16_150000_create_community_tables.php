<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_goal_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['created_at', 'id']);
        });

        Schema::create('community_goal_supports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_goal_post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['community_goal_post_id', 'user_id']);
        });

        Schema::create('community_goal_ideas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_goal_post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('community_book_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 200);
            $table->string('normalized_title', 200);
            $table->string('author', 160)->nullable();
            $table->string('normalized_author', 160)->default('');
            $table->unsignedTinyInteger('rating');
            $table->text('review');
            $table->timestamps();

            $table->index(['normalized_title', 'normalized_author']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_book_reviews');
        Schema::dropIfExists('community_goal_ideas');
        Schema::dropIfExists('community_goal_supports');
        Schema::dropIfExists('community_goal_posts');
    }
};
