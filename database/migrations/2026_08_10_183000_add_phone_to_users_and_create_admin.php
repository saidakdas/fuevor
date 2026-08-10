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
            $table->string('phone', 30)->nullable()->after('email');
        });

        if (app()->environment('testing')) {
            return;
        }

        $adminExists = DB::table('users')->where('email', 'admin@fuevor.com')->exists();
        $adminAttributes = [
            'name' => 'Fuevor Admin',
            'phone' => null,
            'email_verified_at' => now(),
            'password' => '$2y$12$nE6EmUdJnXkws2fSzVG5We89eAMAOfwLInUBCXocID3cOdwpkbbcS',
            'role' => 'admin',
            'updated_at' => now(),
        ];

        if (! $adminExists) {
            $adminAttributes['created_at'] = now();
        }

        DB::table('users')->updateOrInsert(
            ['email' => 'admin@fuevor.com'],
            $adminAttributes,
        );
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('phone');
        });
    }
};
