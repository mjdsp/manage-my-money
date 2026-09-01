<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Liability interest is quoted per month here, not per annum, so the column is
 * renamed from "apr" to "monthly_interest_rate". It stays display-only; no
 * value is converted.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->renameColumn('apr', 'monthly_interest_rate');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->renameColumn('monthly_interest_rate', 'apr');
        });
    }
};
