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
            $table->unsignedBigInteger('fu_balance')->default(0)->after('role');
        });

        Schema::table('goals', function (Blueprint $table) {
            $table->timestamp('fu_awarded_at')->nullable()->after('completed_at');
        });

        DB::table('goals')
            ->where('status', 'completed')
            ->whereNull('fu_awarded_at')
            ->update(['fu_awarded_at' => DB::raw('COALESCE(completed_at, updated_at)')]);

        DB::table('users')->select('id')->orderBy('id')->chunkById(100, function ($users) {
            foreach ($users as $user) {
                $balance = DB::table('goals')
                    ->where('user_id', $user->id)
                    ->whereNotNull('fu_awarded_at')
                    ->count();

                DB::table('users')->where('id', $user->id)->update(['fu_balance' => $balance]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('goals', function (Blueprint $table) {
            $table->dropColumn('fu_awarded_at');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('fu_balance');
        });
    }
};
