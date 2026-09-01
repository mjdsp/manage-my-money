<?php

namespace App\Models;

use App\Support\Money;
use Database\Factories\ReimbursementFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reimbursement extends Model
{
    /** @use HasFactory<ReimbursementFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'notes',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => Money::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<ReimbursementItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(ReimbursementItem::class)->orderBy('position');
    }

    /** @return HasMany<ReimbursementPhoto, $this> */
    public function photos(): HasMany
    {
        return $this->hasMany(ReimbursementPhoto::class)->orderBy('id');
    }
}
