<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Repayment-plan fields for liabilities. With a flat / add-on model any one of
 * {monthly interest, monthly payment, total to be paid} can be derived from the
 * starting balance owed, the term and one of the others.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->unsignedSmallInteger('term_months')->nullable()->after('due_day_of_month');
            $table->bigInteger('total_repayment')->nullable()->after('scheduled_payment_amount'); // centavos
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn(['term_months', 'total_repayment']);
        });
    }
};
