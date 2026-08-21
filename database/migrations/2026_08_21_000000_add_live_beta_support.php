<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('profession')->nullable()->after('phone');
            $table->string('country', 100)->nullable()->after('profession');
            $table->string('gender', 30)->nullable()->after('country');
            $table->timestamp('early_access_at')->nullable()->after('gender')->index();
        });

        Schema::table('goals', function (Blueprint $table) {
            $table->string('beta_key')->nullable()->after('user_id');
            $table->unique(['user_id', 'beta_key'], 'goals_user_beta_key_unique');
        });

        Schema::table('milestones', function (Blueprint $table) {
            $table->string('beta_key')->nullable()->after('goal_id');
            $table->unique(['goal_id', 'beta_key'], 'milestones_goal_beta_key_unique');
        });

        Schema::create('beta_workspaces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('goals')->nullable();
            $table->json('plans')->nullable();
            $table->json('notes')->nullable();
            $table->json('books')->nullable();
            $table->json('profile')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beta_workspaces');

        Schema::table('milestones', function (Blueprint $table) {
            $table->dropUnique('milestones_goal_beta_key_unique');
            $table->dropColumn('beta_key');
        });

        Schema::table('goals', function (Blueprint $table) {
            $table->dropUnique('goals_user_beta_key_unique');
            $table->dropColumn('beta_key');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['early_access_at']);
            $table->dropColumn(['profession', 'country', 'gender', 'early_access_at']);
        });
    }
};
