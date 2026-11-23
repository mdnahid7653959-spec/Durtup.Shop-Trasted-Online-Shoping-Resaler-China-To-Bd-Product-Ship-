<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Category;
use App\Services\RedisCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class CategoryController extends Controller
{
    private RedisCacheService $cacheService;

    public function __construct(RedisCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Get category tree with Redis caching.
     */
    public function index(): JsonResponse
    {
        $categories = $this->cacheService->rememberTagged(['categories'], 'categories:tree', function () {
            return Category::active()
                ->whereNull('parent_id')
                ->with(['children' => function ($q) {
                    $q->active()->withCount('products');
                }])
                ->withCount('products')
                ->get();
        }, 86400); // 24 hours

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Get single category details
     */
    public function show(string|int $idOrSlug): JsonResponse
    {
        $category = Category::where(function ($q) use ($idOrSlug) {
            if (is_numeric($idOrSlug)) {
                $q->where('id', $idOrSlug)->orWhere('slug', (string)$idOrSlug);
            } else {
                $q->where('slug', $idOrSlug);
            }
        })->with('children')->first();

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }
}
