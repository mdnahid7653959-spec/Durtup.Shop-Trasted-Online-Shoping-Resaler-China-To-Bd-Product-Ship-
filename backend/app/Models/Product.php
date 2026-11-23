<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Cache;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'category_id',
        'name',
        'slug',
        'sku',
        'supplier_sku',
        'wholesale_price',
        'regular_price',
        'discount_price',
        'selling_price',
        'margin_percentage',
        'stock_quantity',
        'in_stock',
        'status',
        'approval_status',
        'short_description',
        'description',
        'specifications',
        'rating',
        'reviews_count',
        'sold_count',
        'is_featured',
        'is_trending',
        'free_shipping',
        'source_url',
        'source_type',
        'last_synced_at',
    ];

    protected $casts = [
        'wholesale_price' => 'decimal:2',
        'regular_price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'margin_percentage' => 'decimal:2',
        'stock_quantity' => 'integer',
        'in_stock' => 'boolean',
        'specifications' => 'array',
        'rating' => 'decimal:2',
        'reviews_count' => 'integer',
        'sold_count' => 'integer',
        'is_featured' => 'boolean',
        'is_trending' => 'boolean',
        'free_shipping' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    /**
     * Eager load primary image and category to avoid N+1 query problem
     */
    protected $with = ['primaryImage', 'category'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'product_id')->orderBy('sort_order', 'asc');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class, 'product_id')->where('is_primary', true);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }

    // High-performance scopes for index utilization
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                     ->where('approval_status', 'approved')
                     ->where('in_stock', true);
    }

    public function scopeFeatured($query)
    {
        return $query->active()->where('is_featured', true);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Model boot hooks to trigger cache invalidation
     */
    protected static function booted()
    {
        static::saved(function ($product) {
            Cache::tags(['products'])->flush();
        });

        static::deleted(function ($product) {
            Cache::tags(['products'])->flush();
        });
    }
}
