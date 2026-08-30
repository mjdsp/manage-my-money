<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('kind'); // asset | liability
            $table->boolean('is_archived')->default(false);

            // Savings (asset) extras — display only.
            $table->string('bank_name')->nullable();
            $table->decimal('interest_rate', 6, 3)->nullable(); // annual %, e.g. 2.500

            // Debt (liability) extras.
            $table->string('lender')->nullable();
            $table->decimal('apr', 6, 3)->nullable(); // annual %, display only
            $table->unsignedTinyInteger('due_day_of_month')->nullable();
            $table->bigInteger('scheduled_payment_amount')->nullable(); // centavos
            $table->bigInteger('starting_principal')->nullable(); // centavos

            $table->timestamps();

            $table->index(['user_id', 'is_archived']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
