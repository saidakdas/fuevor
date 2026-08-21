<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('community_goal_posts', 'goal_id')) {
            Schema::table('community_goal_posts', function (Blueprint $table) {
                $table->foreignId('goal_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
                $table->string('demo_goal_key')->nullable()->after('goal_id');
                $table->unique(['user_id', 'goal_id'], 'community_goal_posts_user_goal_unique');
                $table->unique(['user_id', 'demo_goal_key'], 'community_goal_posts_user_demo_goal_unique');
            });
        }

        if (! Schema::hasColumn('community_goal_ideas', 'parent_id')) {
            Schema::table('community_goal_ideas', function (Blueprint $table) {
                $table->foreignId('parent_id')->nullable()->after('community_goal_post_id')->constrained('community_goal_ideas')->cascadeOnDelete();
            });
        }

        if (! Schema::hasIndex('community_book_reviews', 'community_book_reviews_user_id_index')) {
            Schema::table('community_book_reviews', function (Blueprint $table) {
                $table->index('user_id', 'community_book_reviews_user_id_index');
            });
        }

        Schema::table('community_book_reviews', function (Blueprint $table) {
            if (Schema::hasIndex('community_book_reviews', 'community_book_reviews_user_title_unique')) {
                $table->dropUnique('community_book_reviews_user_title_unique');
            }
            $table->unsignedTinyInteger('rating')->nullable()->change();
            $table->text('review')->nullable()->change();
            if (! Schema::hasIndex('community_book_reviews', 'community_books_user_title_author_unique')) {
                $table->unique(
                    ['user_id', 'normalized_title', 'normalized_author'],
                    'community_books_user_title_author_unique',
                );
            }
        });
    }

    public function down(): void
    {
        Schema::table('community_book_reviews', function (Blueprint $table) {
            $table->dropUnique('community_books_user_title_author_unique');
            $table->unsignedTinyInteger('rating')->nullable(false)->change();
            $table->text('review')->nullable(false)->change();
            $table->unique(['user_id', 'normalized_title'], 'community_book_reviews_user_title_unique');
        });

        Schema::table('community_goal_ideas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
        });

        Schema::table('community_goal_posts', function (Blueprint $table) {
            $table->dropUnique('community_goal_posts_user_goal_unique');
            $table->dropUnique('community_goal_posts_user_demo_goal_unique');
            $table->dropConstrainedForeignId('goal_id');
            $table->dropColumn('demo_goal_key');
        });
    }
};
