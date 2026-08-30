<?php

namespace Database\Factories;

use App\Enums\CategoryKind;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->unique()->words(2, true),
            'kind' => CategoryKind::Expense,
            'is_system' => false,
        ];
    }

    public function income(): static
    {
        return $this->state(['kind' => CategoryKind::Income]);
    }

    public function expense(): static
    {
        return $this->state(['kind' => CategoryKind::Expense]);
    }

    public function system(): static
    {
        return $this->state(['is_system' => true]);
    }
}
