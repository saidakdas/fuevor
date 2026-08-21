<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_book_review_replies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_book_review_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index(
                ['community_book_review_id', 'created_at'],
                'book_review_replies_review_created_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_book_review_replies');
    }
};
