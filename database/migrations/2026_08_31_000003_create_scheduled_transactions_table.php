<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Template for the transaction that gets posted each cycle.
            $table->string('description');
            $table->bigInteger('amount'); // centavos, always > 0
            $table->string('type'); // income | expense | transfer
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('from_account_id')->nullable()->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('to_account_id')->nullable()->constrained('accounts')->cascadeOnDelete();

            // Monthly cadence for the MVP.
            $table->unsignedTinyInteger('day_of_month'); // 1..31, clamped to month length
            $table->date('next_due_date');
            $table->unsignedTinyInteger('lead_time_days')->nullable(); // null => config('finance.reminder_lead_days')

            $table->timestamp('last_posted_at')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['user_id', 'is_active', 'next_due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_transactions');
    }
};
