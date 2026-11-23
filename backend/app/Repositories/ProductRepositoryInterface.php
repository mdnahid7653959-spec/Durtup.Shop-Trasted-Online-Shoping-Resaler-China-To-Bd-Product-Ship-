<?php

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Product;

interface ProductRepositoryInterface
{
    public function getPaginatedCatalog(array $filters = [], int $perPage = 24): LengthAwarePaginator;
    
    public function findBySlugOrId(string|int $identifier): ?Product;
    
    public function getFeaturedProducts(int $limit = 12): array;
    
    public function getCategoryProducts(int|string $categoryIdentifier, int $perPage = 24): LengthAwarePaginator;
}
