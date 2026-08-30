<?php

namespace Database\Factories;

use App\Enums\TransactionType;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 *
 * By default this makes an expense from a freshly created asset account. The
 * income()/transfer()/adjustment() states switch the shape; any account you
 * do not pass explicitly is created for the transaction's own user so the
 * per-user invariants hold.
 */
class TransactionFactory extends Factory
{
    protected $model = Transaction::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'date' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'amount' => fake()->numberBetween(10_00, 5_000_00),
            'type' => TransactionType::Expense,
            'category_id' => null,
            'from_account_id' => null,
            'to_account_id' => null,
            'description' => fake()->sentence(3),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Transaction $txn) {
            $user = $txn->user ?: User::find($txn->user_id);
            $type = $txn->type;

            $needsSource = $type === TransactionType::Expense
                || $type === TransactionType::Transfer
                || ($type === TransactionType::Adjustment && $txn->to_account_id === null);

            $needsDestination = $type === TransactionType::Income
                || $type === TransactionType::Transfer
                || ($type === TransactionType::Adjustment && ! $needsSource);

            if ($needsSource && $txn->from_account_id === null) {
                $txn->from_account_id = Account::factory()->for($user)->create()->id;
            }

            if ($needsDestination && $txn->to_account_id === null) {
                $txn->to_account_id = Account::factory()->for($user)->create()->id;
            }
        });
    }

    public function income(): static
    {
        return $this->state(['type' => TransactionType::Income]);
    }

    public function expense(): static
    {
        return $this->state(['type' => TransactionType::Expense]);
    }

    public function transfer(): static
    {
        return $this->state(['type' => TransactionType::Transfer]);
    }

    public function adjustment(): static
    {
        return $this->state(['type' => TransactionType::Adjustment]);
    }

    public function on(string $date): static
    {
        return $this->state(['date' => $date]);
    }

    public function pesos(float $pesos): static
    {
        return $this->state(['amount' => (int) round($pesos * 100)]);
    }
}
