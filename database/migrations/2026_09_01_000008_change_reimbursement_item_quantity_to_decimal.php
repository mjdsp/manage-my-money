<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Allow fractional quantities on reimbursement items — e.g. 10.2 litres of fuel.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reimbursement_items', function (Blueprint $table) {
            $table->decimal('quantity', 12, 3)->change();
        });
    }

    public function down(): void
    {
        Schema::table('reimbursement_items', function (Blueprint $table) {
            $table->unsignedInteger('quantity')->change();
        });
    }
};
