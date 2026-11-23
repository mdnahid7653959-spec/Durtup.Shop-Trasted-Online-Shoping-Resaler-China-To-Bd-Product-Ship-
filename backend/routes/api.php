<?php

use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\SupplierImportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Durtup Hybrid E-Commerce API Routes (V1)
|--------------------------------------------------------------------------
| High-performance routes backed by Redis caching and indexed queries.
*/

Route::prefix('v1')->group(function () {
    // Health & Metrics
    Route::get('/health', [HealthController::class, 'check']);

    // Catalog & Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/featured', [ProductController::class, 'featured']);
    Route::get('/products/{idOrSlug}', [ProductController::class, 'show']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{idOrSlug}', [CategoryController::class, 'show']);

    // Suppliers & Ingestion
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::get('/suppliers/logs', [SupplierController::class, 'logs']);
    Route::post('/suppliers/import-link', [SupplierImportController::class, 'importWebLink']);
    Route::post('/suppliers/{id}/sync', [SupplierImportController::class, 'syncSupplier']);

    // Redis Cache Management
    Route::post('/cache/warm', [SupplierImportController::class, 'warmCache']);
    Route::post('/cache/clear', [SupplierImportController::class, 'clearCache']);
});
