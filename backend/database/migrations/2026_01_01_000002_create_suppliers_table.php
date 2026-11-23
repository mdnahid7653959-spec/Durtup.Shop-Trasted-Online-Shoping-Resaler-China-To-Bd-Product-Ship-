<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // e.g. 'ecomseller_bd', 'cj_dropship', 'taobao', '1688'
            $table->string('name');
            $table->string('base_url')->nullable();
            $table->enum('type', ['direct', 'api', 'catalog_importer', 'web_link'])->default('web_link');
            $table->decimal('default_margin_percent', 5, 2)->default(20.00);
            $table->decimal('default_margin_fixed', 10, 2)->default(0.00);
            $table->boolean('is_active')->default(true);
            $table->json('credentials')->nullable();
            $table->timestamps();

            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
