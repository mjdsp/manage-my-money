<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->bigInteger('amount'); // centavos, always > 0
            $table->string('type'); // income | expense | transfer | adjustment

            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('from_account_id')->nullable()->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('to_account_id')->nullable()->constrained('accounts')->cascadeOnDelete();

            $table->string('description')->nullable();

            // Reserved for the post-MVP CSV import.
            $table->string('external_ref')->nullable();
            $table->uuid('import_batch_id')->nullable();

            // Set when this row was posted from a scheduled transaction.
            $table->foreignId('scheduled_transaction_id')->nullable()->constrained()->nullOnDelete();

            $table->timestamps();

            $table->index(['user_id', 'date']);
            $table->index('from_account_id');
            $table->index('to_account_id');
            $table->index('category_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
