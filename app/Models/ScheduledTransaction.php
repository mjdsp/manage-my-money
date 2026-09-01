<?php

namespace App\Models;

use App\Enums\TransactionType;
use App\Support\Money;
use Carbon\CarbonImmutable;
use Database\Factories\ScheduledTransactionFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScheduledTransaction extends Model
{
    /** @use HasFactory<ScheduledTransactionFactory> */
    use HasFactory;

    protected $fillable = [
        'description',
        'amount',
        'type',
        'category_id',
        'from_account_id',
        'to_account_id',
        'day_of_month',
        'next_due_date',
        'lead_time_days',
        'last_posted_at',
        'is_active',
        'auto_post',
    ];

    protected function casts(): array
    {
        return [
            'amount' => Money::class,
            'type' => TransactionType::class,
            'day_of_month' => 'integer',
            'next_due_date' => 'date',
            'lead_time_days' => 'integer',
            'last_posted_at' => 'datetime',
            'is_active' => 'boolean',
            'auto_post' => 'boolean',
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

    /** @return HasMany<Transaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function effectiveLeadDays(): int
    {
        return $this->lead_time_days ?? (int) config('finance.reminder_lead_days');
    }

    /**
     * The date this becomes visible in the "Upcoming" list.
     */
    public function remindOn(): CarbonImmutable
    {
        return CarbonImmutable::parse($this->next_due_date)->subDays($this->effectiveLeadDays());
    }

    /**
     * Advance next_due_date to the following month, clamping the requested
     * day_of_month to the number of days in that month (e.g. 31 -> 28/29/30).
     */
    public function advanceDueDate(): void
    {
        $current = CarbonImmutable::parse($this->next_due_date);
        $nextMonth = $current->addMonthNoOverflow()->startOfMonth();
        $day = min($this->day_of_month, $nextMonth->daysInMonth);

        $this->next_due_date = $nextMonth->setDay($day);
    }

    /** @param  Builder<ScheduledTransaction>  $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /** @param  Builder<ScheduledTransaction>  $query */
    public function scopeDueOnOrBefore(Builder $query, \DateTimeInterface|string $date): void
    {
        $query->whereDate('next_due_date', '<=', $date);
    }
}
