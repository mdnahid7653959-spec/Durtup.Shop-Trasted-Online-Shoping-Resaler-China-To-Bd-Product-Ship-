<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for variant mapping.
     */
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('title'); // e.g. "Red / XL" or "Midnight Blue"
            $table->string('sku')->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('wholesale_price', 12, 2)->default(0.00);
            $table->integer('stock_quantity')->default(20);
            $table->json('attributes')->nullable(); // e.g. {"color": "Red", "size": "XL"}
            $table->string('image_url', 1024)->nullable(); // Variant specific source image
            $table->timestamps();

            $table->index(['product_id', 'sku'], 'idx_variant_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
