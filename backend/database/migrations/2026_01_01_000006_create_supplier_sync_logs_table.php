<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for logging supplier sync execution metrics.
     */
    public function up(): void
    {
        Schema::create('supplier_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->string('sync_type', 32)->default('api'); // 'api', 'web_link', 'batch'
            $table->enum('status', ['running', 'completed', 'failed'])->default('completed');
            $table->unsignedInteger('items_found')->default(0);
            $table->unsignedInteger('items_imported')->default(0);
            $table->unsignedInteger('items_updated')->default(0);
            $table->unsignedInteger('images_processed')->default(0);
            $table->unsignedInteger('duration_ms')->default(0);
            $table->json('error_details')->nullable();
            $table->timestamps();

            $table->index(['supplier_id', 'status', 'created_at'], 'idx_sync_audit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_sync_logs');
    }
};
