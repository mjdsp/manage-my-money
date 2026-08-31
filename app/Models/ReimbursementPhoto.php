<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReimbursementPhoto extends Model
{
    protected $fillable = [
        'path',
        'original_name',
        'mime',
        'size',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    /** @return BelongsTo<Reimbursement, $this> */
    public function reimbursement(): BelongsTo
    {
        return $this->belongsTo(Reimbursement::class);
    }
}
