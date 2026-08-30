<?php

namespace App\Models;

use App\Enums\TransactionType;
use App\Support\Money;
use Database\Factories\TransactionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    /** @use HasFactory<TransactionFactory> */
    use HasFactory;

    protected $fillable = [
        'date',
        'amount',
        'type',
        'category_id',
        'from_account_id',
        'to_account_id',
        'description',
        'external_ref',
        'import_batch_id',
        'scheduled_transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'amount' => Money::class,
            'type' => TransactionType::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return BelongsTo<Account, $this> */
    public function fromAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'from_account_id');
    }

    /** @return BelongsTo<Account, $this> */
    public function toAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    /** @return BelongsTo<ScheduledTransaction, $this> */
    public function scheduledTransaction(): BelongsTo
    {
        return $this->belongsTo(ScheduledTransaction::class);
    }

    /**
     * Restrict to transactions dated within the given inclusive range.
     *
     * @param  Builder<Transaction>  $query
     */
    public function scopeBetween(Builder $query, \DateTimeInterface|string $from, \DateTimeInterface|string $to): void
    {
        $query->whereBetween('date', [$from, $to]);
    }
}
