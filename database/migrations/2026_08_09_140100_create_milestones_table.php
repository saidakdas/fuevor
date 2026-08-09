<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('target_date')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->string('status', 30)->default('pending');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['goal_id', 'position']);
            $table->index(['goal_id', 'status', 'target_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('milestones');
    }
};
