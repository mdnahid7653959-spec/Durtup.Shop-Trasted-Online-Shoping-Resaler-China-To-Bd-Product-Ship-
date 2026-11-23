<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class RedisCacheService
{
    private const DEFAULT_TTL_SECONDS = 3600; // 1 hour
    private const HOT_CATALOG_TTL = 86400;     // 24 hours

    /**
     * Cache a query result using Redis with tag-based invalidation.
     */
    public function rememberTagged(array $tags, string $key, callable $callback, int $ttl = self::DEFAULT_TTL_SECONDS): mixed
    {
        try {
            // If Redis supports tags
            if (config('cache.default') === 'redis') {
                return Cache::tags($tags)->remember($key, $ttl, $callback);
            }
            return Cache::remember($key, $ttl, $callback);
        } catch (\Throwable $e) {
            Log::warning("[RedisCacheService] Cache operation failed, falling back to direct computation: " . $e->getMessage());
            return $callback();
        }
    }

    /**
     * Store item in Redis.
     */
    public function put(string $key, mixed $value, int $ttl = self::DEFAULT_TTL_SECONDS): bool
    {
        try {
            return Cache::put($key, $value, $ttl);
        } catch (\Throwable $e) {
            Log::error("[RedisCacheService] Cache put error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get item from Redis.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        try {
            return Cache::get($key, $default);
        } catch (\Throwable $e) {
            return $default;
        }
    }

    /**
     * Invalidate entire tag or keyspace when products change.
     */
    public function invalidateProducts(): void
    {
        try {
            if (config('cache.default') === 'redis') {
                Cache::tags(['products'])->flush();
            } else {
                // Clear all product keys pattern
                Cache::forget('catalog:all');
                Cache::forget('catalog:featured');
            }
            Log::info("[RedisCacheService] Product catalog cache invalidated successfully.");
        } catch (\Throwable $e) {
            Log::error("[RedisCacheService] Cache invalidation failed: " . $e->getMessage());
        }
    }

    /**
     * Pre-warm Redis cache for instant load of catalog & categories.
     */
    public function warmUpProductCache(callable $catalogFetcher, callable $categoryFetcher): array
    {
        $startTime = microtime(true);
        $warmed = [];

        try {
            // Warm categories
            $categories = $categoryFetcher();
            $this->put('catalog:categories', $categories, self::HOT_CATALOG_TTL);
            $warmed['categories_count'] = count($categories);

            // Warm catalog
            $products = $catalogFetcher();
            $this->put('catalog:all', $products, self::HOT_CATALOG_TTL);
            $warmed['products_count'] = count($products);

            $durationMs = round((microtime(true) - $startTime) * 1000, 2);
            $warmed['duration_ms'] = $durationMs;
            $warmed['status'] = 'success';

            Log::info("[RedisCacheService] Pre-warm completed in {$durationMs}ms.");
            return $warmed;
        } catch (\Throwable $e) {
            Log::error("[RedisCacheService] Pre-warm error: " . $e->getMessage());
            return [
                'status' => 'failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get real-time Redis cache diagnostics.
     */
    public function getCacheStats(): array
    {
        try {
            if (config('cache.default') === 'redis') {
                $info = Redis::connection()->info();
                return [
                    'driver' => 'redis',
                    'status' => 'connected',
                    'used_memory_human' => $info['used_memory_human'] ?? 'unknown',
                    'connected_clients' => $info['connected_clients'] ?? 0,
                    'total_keys' => $info['db0']['keys'] ?? ($info['db1']['keys'] ?? 'unknown'),
                    'uptime_in_seconds' => $info['uptime_in_seconds'] ?? 0,
                ];
            }

            return [
                'driver' => config('cache.default', 'file'),
                'status' => 'operational',
                'message' => 'Standard caching active',
            ];
        } catch (\Throwable $e) {
            return [
                'driver' => 'redis',
                'status' => 'disconnected',
                'error' => $e->getMessage(),
            ];
        }
    }
}
