<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_book_reviews', function (Blueprint $table) {
            $table->unique(['user_id', 'normalized_title'], 'community_book_reviews_user_title_unique');
        });
    }

    public function down(): void
    {
        Schema::table('community_book_reviews', function (Blueprint $table) {
            $table->dropUnique('community_book_reviews_user_title_unique');
        });
    }
};
