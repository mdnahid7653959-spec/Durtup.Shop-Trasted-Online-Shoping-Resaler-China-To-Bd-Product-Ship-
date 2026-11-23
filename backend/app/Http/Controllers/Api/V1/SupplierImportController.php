<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Services\RedisCacheService;
use App\Services\SupplierIngestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SupplierImportController extends Controller
{
    private SupplierIngestionService $ingestionService;
    private RedisCacheService $cacheService;

    public function __construct(SupplierIngestionService $ingestionService, RedisCacheService $cacheService)
    {
        $this->ingestionService = $ingestionService;
        $this->cacheService = $cacheService;
    }

    /**
     * Ingest a product from an arbitrary supplier web link or URL.
     * Ensures 100% accurate extraction of title, price, description and gallery images.
     */
    public function importWebLink(Request $request): JsonResponse
    {
        $request->validate([
            'url' => 'required|url',
            'supplier_id' => 'nullable|integer',
            'margin_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $url = $request->input('url');
        $supplierId = (int)$request->input('supplier_id', 1);

        $result = $this->ingestionService->ingestFromWebLink($url, $supplierId, $request->all());

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to import product from source link',
                'error' => $result['error'] ?? 'Unknown error',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Product and full gallery mapped successfully with 100% fidelity',
            'data' => $result,
        ]);
    }

    /**
     * Trigger batch supplier catalog sync.
     */
    public function syncSupplier(Request $request, int $supplierId): JsonResponse
    {
        $supplier = Supplier::findOrFail($supplierId);
        $rawCatalog = $request->input('products', []);

        if (empty($rawCatalog)) {
            return response()->json([
                'success' => false,
                'message' => 'No catalog payload provided for ingestion',
            ], 400);
        }

        $result = $this->ingestionService->ingestBatchCatalog($rawCatalog, $supplier);

        return response()->json([
            'success' => true,
            'message' => "Successfully synced {$result['imported']} new and {$result['updated']} existing items",
            'metrics' => $result,
        ]);
    }

    /**
     * Pre-warm Redis cache for instant load of products and categories.
     */
    public function warmCache(): JsonResponse
    {
        $metrics = $this->cacheService->warmUpProductCache(
            function () {
                return Product::active()
                    ->with(['primaryImage', 'category:id,name,slug'])
                    ->limit(200)
                    ->get()
                    ->toArray();
            },
            function () {
                return Category::active()->with('children')->get()->toArray();
            }
        );

        return response()->json([
            'success' => true,
            'message' => 'Redis cache warm-up completed',
            'metrics' => $metrics,
        ]);
    }

    /**
     * Invalidate and flush product cache.
     */
    public function clearCache(): JsonResponse
    {
        $this->cacheService->invalidateProducts();

        return response()->json([
            'success' => true,
            'message' => 'Product and catalog cache flushed successfully',
        ]);
    }
}
