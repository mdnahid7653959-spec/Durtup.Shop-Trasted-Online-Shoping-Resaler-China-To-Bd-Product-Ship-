<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Supplier;
use App\Models\SupplierSyncLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class SupplierController extends Controller
{
    /**
     * Get all registered suppliers.
     */
    public function index(): JsonResponse
    {
        $suppliers = Supplier::withCount('products')->get();

        return response()->json([
            'success' => true,
            'data' => $suppliers,
        ]);
    }

    /**
     * Get latest sync history and logs.
     */
    public function logs(): JsonResponse
    {
        $logs = SupplierSyncLog::with('supplier:id,name,code')
            ->orderBy('id', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}
