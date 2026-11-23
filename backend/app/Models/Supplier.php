<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'base_url',
        'type',
        'default_margin_percent',
        'default_margin_fixed',
        'is_active',
        'credentials',
    ];

    protected $casts = [
        'default_margin_percent' => 'decimal:2',
        'default_margin_fixed' => 'decimal:2',
        'is_active' => 'boolean',
        'credentials' => 'array',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'supplier_id');
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(SupplierSyncLog::class, 'supplier_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
