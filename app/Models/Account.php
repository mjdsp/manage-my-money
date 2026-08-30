<?php

namespace App\Models;

use App\Enums\AccountKind;
use App\Support\Money;
use Database\Factories\AccountFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    /** @use HasFactory<AccountFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'kind',
        'is_archived',
        'bank_name',
        'interest_rate',
        'lender',
        'apr',
        'due_day_of_month',
        'scheduled_payment_amount',
        'starting_principal',
    ];

    protected function casts(): array
    {
        return [
            'kind' => AccountKind::class,
            'is_archived' => 'boolean',
            'interest_rate' => 'decimal:3',
            'apr' => 'decimal:3',
            'due_day_of_month' => 'integer',
            'scheduled_payment_amount' => Money::class,
            'starting_principal' => Money::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Transaction, $this> */
    public function outgoingTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'from_account_id');
    }

    /** @return HasMany<Transaction, $this> */
    public function incomingTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'to_account_id');
    }

    public function isAsset(): bool
    {
        return $this->kind === AccountKind::Asset;
    }

    public function isLiability(): bool
    {
        return $this->kind === AccountKind::Liability;
    }

    /** @param  Builder<Account>  $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_archived', false);
    }
}
