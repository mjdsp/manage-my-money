<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reimbursement_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reimbursement_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->string('item_name');
            $table->bigInteger('unit_price'); // centavos, price per single unit
            $table->bigInteger('line_total'); // centavos, quantity * unit_price
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index('reimbursement_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reimbursement_items');
    }
};
