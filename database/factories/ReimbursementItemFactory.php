<?php

namespace Database\Factories;

use App\Models\Reimbursement;
use App\Models\ReimbursementItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReimbursementItem>
 */
class ReimbursementItemFactory extends Factory
{
    protected $model = ReimbursementItem::class;

    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 10);
        $unitPrice = fake()->numberBetween(50_00, 5_000_00);

        return [
            'reimbursement_id' => Reimbursement::factory(),
            'quantity' => $quantity,
            'item_name' => fake()->words(2, true),
            'unit_price' => $unitPrice,
            'line_total' => $unitPrice * $quantity,
            'position' => 0,
        ];
    }
}
