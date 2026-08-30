<?php

namespace Database\Seeders;

use App\Actions\SeedDefaultCategories;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Creates the single local account (you) and its starter categories.
     * Accounts and transactions are created in-app.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'me@example.com'],
            [
                'name' => 'Me',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        app(SeedDefaultCategories::class)->handle($user);
    }
}
