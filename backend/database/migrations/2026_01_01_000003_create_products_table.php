<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations with high-performance composite indexes for instant querying.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null');
            $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('set null');
            
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku')->unique();
            $table->string('supplier_sku')->nullable();
            
            // High-precision financial pricing
            $table->decimal('wholesale_price', 12, 2)->default(0.00);
            $table->decimal('regular_price', 12, 2)->nullable();
            $table->decimal('discount_price', 12, 2)->nullable();
            $table->decimal('selling_price', 12, 2)->index(); // Indexed for range filtering
            $table->decimal('margin_percentage', 5, 2)->default(20.00);
            
            $table->integer('stock_quantity')->default(50);
            $table->boolean('in_stock')->default(true);
            $table->enum('status', ['draft', 'active', 'archived'])->default('active');
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('approved');
            
            $table->text('short_description')->nullable();
            $table->longText('description')->nullable();
            $table->json('specifications')->nullable();
            
            $table->decimal('rating', 3, 2)->default(4.80);
            $table->unsignedInteger('reviews_count')->default(25);
            $table->unsignedInteger('sold_count')->default(40);
            
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_trending')->default(false);
            $table->boolean('free_shipping')->default(true);
            
            $table->string('source_url', 1024)->nullable();
            $table->string('source_type', 64)->default('api'); // 'api', 'web_link', 'direct'
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            // High-Speed Query Optimization Composite Indexes
            $table->index(['status', 'approval_status', 'in_stock'], 'idx_products_catalog_active');
            $table->index(['category_id', 'status', 'selling_price'], 'idx_products_category_pricing');
            $table->index(['supplier_id', 'supplier_sku'], 'idx_products_supplier_lookup');
            $table->index(['is_featured', 'status'], 'idx_products_featured');
            $table->index('created_at', 'idx_products_newest');
            
            // Fulltext indexing for lightning-fast product search
            $table->fullText(['name', 'sku', 'short_description'], 'idx_products_fulltext_search');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
