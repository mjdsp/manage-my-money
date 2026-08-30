<?php

namespace Database\Factories;

use App\Enums\TransactionType;
use App\Models\Account;
use App\Models\ScheduledTransaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScheduledTransaction>
 */
class ScheduledTransactionFactory extends Factory
{
    protected $model = ScheduledTransaction::class;

    public function definition(): array
    {
        $day = fake()->numberBetween(1, 28);

        return [
            'user_id' => User::factory(),
            'description' => fake()->randomElement(['Rent', 'Electricity', 'Internet', 'Netflix', 'Gym']),
            'amount' => fake()->numberBetween(200_00, 20_000_00),
            'type' => TransactionType::Expense,
            'category_id' => null,
            'from_account_id' => null,
            'to_account_id' => null,
            'day_of_month' => $day,
            'next_due_date' => CarbonImmutable::now()->startOfMonth()->setDay($day),
            'lead_time_days' => null,
            'last_posted_at' => null,
            'is_active' => true,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (ScheduledTransaction $st) {
            $user = $st->user ?: User::find($st->user_id);

            if ($st->type->requiresSource() && $st->from_account_id === null) {
                $st->from_account_id = Account::factory()->for($user)->create()->id;
            }

            if ($st->type->requiresDestination() && $st->to_account_id === null) {
                $st->to_account_id = Account::factory()->for($user)->create()->id;
            }
        });
    }

    public function dueOn(string $date): static
    {
        $date = CarbonImmutable::parse($date);

        return $this->state([
            'next_due_date' => $date,
            'day_of_month' => (int) $date->day,
        ]);
    }

    public function leadDays(int $days): static
    {
        return $this->state(['lead_time_days' => $days]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    public function debtPayment(): static
    {
        return $this->state(['type' => TransactionType::Transfer, 'description' => 'Loan payment']);
    }
}
