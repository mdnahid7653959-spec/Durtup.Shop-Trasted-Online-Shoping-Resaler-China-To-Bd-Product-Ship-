<?php

namespace App\Http\Controllers\Api\V1;

use App\Repositories\ProductRepositoryInterface;
use App\Services\RedisCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ProductController extends Controller
{
    private ProductRepositoryInterface $productRepo;
    private RedisCacheService $cacheService;

    public function __construct(ProductRepositoryInterface $productRepo, RedisCacheService $cacheService)
    {
        $this->productRepo = $productRepo;
        $this->cacheService = $cacheService;
    }

    /**
     * Display a paginated, Redis-cached listing of products.
     * Response time benchmark: < 20ms when cached.
     */
    public function index(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        $filters = [
            'q' => $request->query('q'),
            'category_id' => $request->query('category_id'),
            'category_slug' => $request->query('category_slug'),
            'min_price' => $request->query('min_price'),
            'max_price' => $request->query('max_price'),
            'in_stock_only' => $request->boolean('in_stock_only', true),
            'sort' => $request->query('sort', 'newest'),
            'page' => $request->integer('page', 1),
        ];

        $perPage = min(100, max(1, $request->integer('per_page', 24)));
        $products = $this->productRepo->getPaginatedCatalog($filters, $perPage);

        $durationMs = round((microtime(true) - $startTime) * 1000, 2);

        return response()->json([
            'success' => true,
            'meta' => [
                'total' => $products->total(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'execution_time_ms' => $durationMs,
                'cached' => $durationMs < 25.0,
            ],
            'data' => $products->items(),
        ]);
    }

    /**
     * Get single product detail with gallery and variants.
     */
    public function show(string|int $idOrSlug): JsonResponse
    {
        $startTime = microtime(true);
        $product = $this->productRepo->findBySlugOrId($idOrSlug);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        $durationMs = round((microtime(true) - $startTime) * 1000, 2);

        return response()->json([
            'success' => true,
            'meta' => [
                'execution_time_ms' => $durationMs,
            ],
            'data' => $product,
        ]);
    }

    /**
     * Return featured hot products.
     */
    public function featured(Request $request): JsonResponse
    {
        $limit = min(50, max(1, $request->integer('limit', 12)));
        $products = $this->productRepo->getFeaturedProducts($limit);

        return response()->json([
            'success' => true,
            'count' => count($products),
            'data' => $products,
        ]);
    }
}
