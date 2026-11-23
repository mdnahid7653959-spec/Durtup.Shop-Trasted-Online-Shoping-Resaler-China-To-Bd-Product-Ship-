<?php

namespace App\Repositories;

use App\Models\Product;
use App\Services\RedisCacheService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProductRepository implements ProductRepositoryInterface
{
    private RedisCacheService $cacheService;

    public function __construct(RedisCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Highly optimized catalog query with index matching and eager loading.
     */
    public function getPaginatedCatalog(array $filters = [], int $perPage = 24): LengthAwarePaginator
    {
        $page = (int)($filters['page'] ?? 1);
        $cacheKey = "catalog:p_{$page}_lim_{$perPage}_" . md5(json_encode($filters));

        return $this->cacheService->rememberTagged(['products'], $cacheKey, function () use ($filters, $perPage) {
            $query = Product::query()
                ->select([
                    'id', 'supplier_id', 'category_id', 'name', 'slug', 'sku',
                    'regular_price', 'discount_price', 'selling_price', 'wholesale_price',
                    'stock_quantity', 'in_stock', 'rating', 'reviews_count', 'sold_count',
                    'is_featured', 'is_trending', 'free_shipping', 'created_at'
                ])
                ->with([
                    'category:id,name,slug',
                    'primaryImage:id,product_id,image_url',
                    'images:id,product_id,image_url,is_primary,sort_order'
                ])
                ->where('status', 'active')
                ->where('approval_status', 'approved');

            // Category filter
            if (!empty($filters['category_id'])) {
                $query->where('category_id', $filters['category_id']);
            } elseif (!empty($filters['category_slug'])) {
                $query->whereHas('category', function ($q) use ($filters) {
                    $q->where('slug', $filters['category_slug']);
                });
            }

            // Keyword Search using fulltext index
            if (!empty($filters['q'])) {
                $searchTerm = trim($filters['q']);
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('sku', 'like', "%{$searchTerm}%");
                });
            }

            // Price range filter
            if (isset($filters['min_price'])) {
                $query->where('selling_price', '>=', (float)$filters['min_price']);
            }
            if (isset($filters['max_price'])) {
                $query->where('selling_price', '<=', (float)$filters['max_price']);
            }

            // In-stock only
            if (!empty($filters['in_stock_only'])) {
                $query->where('in_stock', true);
            }

            // Sorting strategy
            $sort = $filters['sort'] ?? 'newest';
            switch ($sort) {
                case 'price_low_high':
                    $query->orderBy('selling_price', 'asc');
                    break;
                case 'price_high_low':
                    $query->orderBy('selling_price', 'desc');
                    break;
                case 'popular':
                    $query->orderBy('sold_count', 'desc');
                    break;
                case 'top_rated':
                    $query->orderBy('rating', 'desc');
                    break;
                case 'newest':
                default:
                    $query->orderBy('id', 'desc');
                    break;
            }

            return $query->paginate($perPage);
        }, 1800); // 30 mins TTL
    }

    /**
     * Find single product with all details, full gallery images and variants
     */
    public function findBySlugOrId(string|int $identifier): ?Product
    {
        $cacheKey = "product:detail_{$identifier}";

        return $this->cacheService->rememberTagged(['products'], $cacheKey, function () use ($identifier) {
            return Product::with([
                'category',
                'supplier:id,name,code',
                'images',
                'variants'
            ])
            ->where('status', 'active')
            ->where(function ($q) use ($identifier) {
                if (is_numeric($identifier)) {
                    $q->where('id', $identifier)->orWhere('slug', (string)$identifier);
                } else {
                    $q->where('slug', $identifier)->orWhere('sku', $identifier);
                }
            })
            ->first();
        }, 3600);
    }

    /**
     * Get hot/featured products
     */
    public function getFeaturedProducts(int $limit = 12): array
    {
        return $this->cacheService->rememberTagged(['products'], "catalog:featured_limit_{$limit}", function () use ($limit) {
            return Product::active()
                ->where('is_featured', true)
                ->with(['primaryImage', 'category:id,name,slug'])
                ->orderBy('sold_count', 'desc')
                ->limit($limit)
                ->get()
                ->toArray();
        }, 3600);
    }

    /**
     * Get products by category with pagination
     */
    public function getCategoryProducts(int|string $categoryIdentifier, int $perPage = 24): LengthAwarePaginator
    {
        return $this->getPaginatedCatalog([
            is_numeric($categoryIdentifier) ? 'category_id' : 'category_slug' => $categoryIdentifier
        ], $perPage);
    }
}
