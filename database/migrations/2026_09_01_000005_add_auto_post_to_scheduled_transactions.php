<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When set, a due schedule posts itself to the ledger (and rolls forward)
 * instead of only showing up as a reminder.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scheduled_transactions', function (Blueprint $table) {
            $table->boolean('auto_post')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('scheduled_transactions', function (Blueprint $table) {
            $table->dropColumn('auto_post');
        });
    }
};
