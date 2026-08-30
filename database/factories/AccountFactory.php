<?php

namespace Database\Factories;

use App\Enums\AccountKind;
use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Account>
 */
class AccountFactory extends Factory
{
    protected $model = Account::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(2, true),
            'kind' => AccountKind::Asset,
            'is_archived' => false,
        ];
    }

    public function asset(): static
    {
        return $this->state(['kind' => AccountKind::Asset]);
    }

    public function savings(): static
    {
        return $this->state([
            'kind' => AccountKind::Asset,
            'name' => 'Savings',
            'bank_name' => fake()->company(),
            'interest_rate' => fake()->randomFloat(3, 0.25, 4),
        ]);
    }

    public function liability(): static
    {
        return $this->state([
            'kind' => AccountKind::Liability,
            'name' => 'Loan',
            'lender' => fake()->company(),
            'apr' => fake()->randomFloat(3, 5, 36),
            'due_day_of_month' => fake()->numberBetween(1, 28),
            'scheduled_payment_amount' => fake()->numberBetween(50000, 500000),
            'starting_principal' => fake()->numberBetween(1000000, 20000000),
        ]);
    }

    public function archived(): static
    {
        return $this->state(['is_archived' => true]);
    }
}
