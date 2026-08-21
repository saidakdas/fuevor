<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('first_builder_number')->nullable()->unique()->after('early_access_at');
        });

        Schema::create('first_builder_counters', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->unsignedSmallInteger('next_number');
        });

        DB::table('first_builder_counters')->insert([
            'id' => 1,
            'next_number' => 1,
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('first_builder_counters');

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['first_builder_number']);
            $table->dropColumn('first_builder_number');
        });
    }
};
