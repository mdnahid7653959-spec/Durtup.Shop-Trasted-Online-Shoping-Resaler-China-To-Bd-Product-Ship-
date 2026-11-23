<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Supplier;
use App\Models\SupplierSyncLog;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SupplierIngestionService
{
    private Client $httpClient;
    private RedisCacheService $cacheService;

    public function __construct(RedisCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
        $this->httpClient = new Client([
            'timeout' => 15.0,
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Accept' => 'application/json, text/html, */*',
            ]
        ]);
    }

    /**
     * Ingest and map product from any Web Link (China Dropship, 1688, Taobao, CJ, or direct seller URL)
     */
    public function ingestFromWebLink(string $url, int $supplierId = 1, array $overrides = []): array
    {
        $startTime = microtime(true);
        try {
            $response = $this->httpClient->get($url);
            $html = (string)$response->getBody();

            // Extract title
            $title = $overrides['name'] ?? null;
            if (!$title && preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $matches)) {
                $title = trim(html_entity_decode($matches[1]));
                // Clean common title suffixes
                $title = preg_replace('/(\s*[-|–]\s*(?:Online Shopping|Daraz|AliExpress|Taobao|Shop).*)$/i', '', $title);
            }
            $title = $title ?: 'Imported Supplier Product ' . time();

            // Extract description
            $description = $overrides['description'] ?? null;
            if (!$description && preg_match('/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $matches)) {
                $description = trim(html_entity_decode($matches[1]));
            }

            // Extract price
            $wholesalePrice = $overrides['wholesale_price'] ?? null;
            if (!$wholesalePrice && preg_match('/(?:\$|৳|¥|BDT|TK|USD)\s*([0-9]+(?:\.[0-9]{2})?)/i', $html, $matches)) {
                $wholesalePrice = (float)$matches[1];
            }
            $wholesalePrice = $wholesalePrice ?: 450.00;

            // Extract source images from HTML
            $rawImages = ImageMappingService::extractImagesFromHtml($html, $url);
            if (!empty($overrides['images'])) {
                $rawImages = array_merge($rawImages, $overrides['images']);
            }

            // Map and normalize gallery images
            $mappedImages = ImageMappingService::mapImageGallery($rawImages, $overrides['image'] ?? null, $url);

            // Compute retail & selling prices
            $marginPercent = (float)($overrides['margin_percentage'] ?? 25.00);
            $sellingPrice = round($wholesalePrice * (1 + ($marginPercent / 100)), 0);
            $regularPrice = round($sellingPrice * 1.25, 0); // 20% strikethrough markdown

            $sku = 'IMP-' . strtoupper(Str::random(8));

            // Upsert into database
            DB::beginTransaction();

            $product = Product::create([
                'supplier_id' => $supplierId,
                'category_id' => $overrides['category_id'] ?? null,
                'name' => $title,
                'slug' => Str::slug($title) . '-' . strtolower(Str::random(5)),
                'sku' => $sku,
                'supplier_sku' => $overrides['supplier_sku'] ?? $sku,
                'wholesale_price' => $wholesalePrice,
                'regular_price' => $regularPrice,
                'discount_price' => $sellingPrice,
                'selling_price' => $sellingPrice,
                'margin_percentage' => $marginPercent,
                'stock_quantity' => $overrides['stock_quantity'] ?? 50,
                'in_stock' => true,
                'status' => 'active',
                'approval_status' => 'approved',
                'short_description' => Str::limit($description ?: $title, 150),
                'description' => $description ?: $title,
                'source_url' => $url,
                'source_type' => 'web_link',
                'last_synced_at' => now(),
            ]);

            // Save images
            foreach ($mappedImages as $img) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $img['image_url'],
                    'original_source_url' => $img['original_source_url'],
                    'is_primary' => $img['is_primary'],
                    'sort_order' => $img['sort_order'],
                ]);
            }

            DB::commit();

            // Invalidate Redis cache
            $this->cacheService->invalidateProducts();

            $durationMs = round((microtime(true) - $startTime) * 1000, 2);

            return [
                'success' => true,
                'product_id' => $product->id,
                'name' => $product->name,
                'selling_price' => $product->selling_price,
                'images_count' => count($mappedImages),
                'primary_image' => $mappedImages[0]['image_url'] ?? null,
                'duration_ms' => $durationMs,
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error("[SupplierIngestionService] Failed to ingest from {$url}: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Ingest batch raw supplier catalog items (e.g. from Ecomseller BD API)
     */
    public function ingestBatchCatalog(array $rawProducts, Supplier $supplier): array
    {
        $startTime = microtime(true);
        $imported = 0;
        $updated = 0;
        $imagesTotal = 0;

        foreach ($rawProducts as $raw) {
            try {
                $code = (string)($raw['code'] ?? $raw['id'] ?? '');
                if (empty($code)) continue;

                $supplierSku = 'ECOM-' . $code;
                $wholesalePrice = (float)($raw['resellerPrice'] ?? $raw['price'] ?? 0);
                $marginPercent = (float)$supplier->default_margin_percent ?: 20.00;
                
                // Pricing calculations
                $sellingPrice = round($wholesalePrice * (1 + ($marginPercent / 100)), 0);
                $regularPrice = round($sellingPrice * 1.20, 0);

                $title = trim($raw['name'] ?? 'Supplier Product ' . $code);
                $slug = Str::slug($title) . '-' . $code;

                // Map images with 100% accurate CDN resolution
                $rawImgs = !empty($raw['images']) && is_array($raw['images']) ? $raw['images'] : (!empty($raw['image']) ? [$raw['image']] : []);
                $gallery = ImageMappingService::mapImageGallery($rawImgs, $raw['image'] ?? null, $supplier->base_url ?: 'https://ecomsellerbd.com');

                DB::beginTransaction();

                $product = Product::updateOrCreate(
                    [
                        'supplier_id' => $supplier->id,
                        'supplier_sku' => $supplierSku,
                    ],
                    [
                        'name' => $title,
                        'slug' => $slug,
                        'sku' => $supplierSku,
                        'wholesale_price' => $wholesalePrice,
                        'regular_price' => $regularPrice,
                        'discount_price' => $sellingPrice,
                        'selling_price' => $sellingPrice,
                        'margin_percentage' => $marginPercent,
                        'stock_quantity' => 50,
                        'in_stock' => true,
                        'status' => 'active',
                        'approval_status' => 'approved',
                        'short_description' => $raw['short'] ?? '',
                        'description' => $raw['description'] ?? $raw['short'] ?? '',
                        'source_type' => 'api',
                        'last_synced_at' => now(),
                    ]
                );

                if ($product->wasRecentlyCreated) {
                    $imported++;
                } else {
                    $updated++;
                }

                // Delete old images & re-sync gallery cleanly
                ProductImage::where('product_id', $product->id)->delete();
                foreach ($gallery as $img) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $img['image_url'],
                        'original_source_url' => $img['original_source_url'],
                        'is_primary' => $img['is_primary'],
                        'sort_order' => $img['sort_order'],
                    ]);
                    $imagesTotal++;
                }

                DB::commit();
            } catch (\Throwable $e) {
                DB::rollBack();
                Log::warning("[SupplierIngestionService] Skipping product {$code}: " . $e->getMessage());
            }
        }

        $durationMs = round((microtime(true) - $startTime) * 1000, 2);

        // Record sync log
        SupplierSyncLog::create([
            'supplier_id' => $supplier->id,
            'sync_type' => 'api',
            'status' => 'completed',
            'items_found' => count($rawProducts),
            'items_imported' => $imported,
            'items_updated' => $updated,
            'images_processed' => $imagesTotal,
            'duration_ms' => $durationMs,
        ]);

        // Invalidate Redis cache
        $this->cacheService->invalidateProducts();

        return [
            'imported' => $imported,
            'updated' => $updated,
            'images_processed' => $imagesTotal,
            'duration_ms' => $durationMs,
        ];
    }
}
