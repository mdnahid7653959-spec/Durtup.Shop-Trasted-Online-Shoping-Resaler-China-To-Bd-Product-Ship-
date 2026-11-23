<?php

namespace App\Http\Controllers\Api\V1;

use App\Services\RedisCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    private RedisCacheService $cacheService;

    public function __construct(RedisCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * System health and cache statistics.
     */
    public function check(): JsonResponse
    {
        $startTime = microtime(true);
        $dbStatus = 'connected';
        try {
            DB::connection()->getPdo();
        } catch (\Throwable $e) {
            $dbStatus = 'disconnected: ' . $e->getMessage();
        }

        $cacheStats = $this->cacheService->getCacheStats();
        $durationMs = round((microtime(true) - $startTime) * 1000, 2);

        return response()->json([
            'status' => 'healthy',
            'platform' => 'Durtup Hybrid Laravel E-Commerce Architecture',
            'version' => '1.0.0',
            'database' => $dbStatus,
            'cache' => $cacheStats,
            'latency_ms' => $durationMs,
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
