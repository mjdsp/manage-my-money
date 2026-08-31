<?php

namespace App\Models;

use App\Support\Money;
use Database\Factories\ReimbursementItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReimbursementItem extends Model
{
    /** @use HasFactory<ReimbursementItemFactory> */
    use HasFactory;

    protected $fillable = [
        'quantity',
        'item_name',
        'unit_price',
        'line_total',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'float',
            'unit_price' => Money::class,
            'line_total' => Money::class,
            'position' => 'integer',
        ];
    }

    /** @return BelongsTo<Reimbursement, $this> */
    public function reimbursement(): BelongsTo
    {
        return $this->belongsTo(Reimbursement::class);
    }
}
