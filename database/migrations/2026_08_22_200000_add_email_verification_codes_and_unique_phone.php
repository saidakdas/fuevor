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
            $table->string('email_verification_code_hash')->nullable()->after('email_verified_at');
            $table->timestamp('email_verification_code_expires_at')->nullable()->after('email_verification_code_hash');
            $table->timestamp('email_verification_code_sent_at')->nullable()->after('email_verification_code_expires_at');
            $table->unsignedTinyInteger('email_verification_attempts')->default(0)->after('email_verification_code_sent_at');
        });

        // Email verification was not required before this release. Existing
        // members keep uninterrupted access; only new registrations need a code.
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);

        $hasDuplicatePhone = DB::table('users')
            ->select('phone')
            ->whereNotNull('phone')
            ->groupBy('phone')
            ->havingRaw('COUNT(*) > 1')
            ->exists();

        if (! $hasDuplicatePhone) {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('phone', 'users_phone_unique');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex('users', 'users_phone_unique')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_phone_unique');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'email_verification_code_hash',
                'email_verification_code_expires_at',
                'email_verification_code_sent_at',
                'email_verification_attempts',
            ]);
        });
    }
};
