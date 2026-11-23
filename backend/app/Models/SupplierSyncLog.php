<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierSyncLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'sync_type',
        'status',
        'items_found',
        'items_imported',
        'items_updated',
        'images_processed',
        'duration_ms',
        'error_details',
    ];

    protected $casts = [
        'items_found' => 'integer',
        'items_imported' => 'integer',
        'items_updated' => 'integer',
        'images_processed' => 'integer',
        'duration_ms' => 'integer',
        'error_details' => 'array',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
}
