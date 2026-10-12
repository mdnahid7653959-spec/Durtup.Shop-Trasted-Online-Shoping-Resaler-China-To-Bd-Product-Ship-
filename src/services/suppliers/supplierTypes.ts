export type SupplierSourceId = 'durtup' | 'dropshipping_bd' | 'ecomseller_bd' | string;

export interface SupplierMeta {
  id: SupplierSourceId;
  name: string;
  type: 'direct' | 'api' | 'catalog_importer';
  sourceUrl?: string;
  apiBaseUrl?: string;
  isActive: boolean;
  statusText: string;
}

export interface EcomsellerRawCategory {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  count?: number;
}

export interface EcomsellerRawBrand {
  id: string;
  name: string;
  slug: string;
}

export interface EcomsellerRawProduct {
  id: string;
  name: string;
  slug: string;
  code: string;
  short?: string;
  price: number; // Suggested Sale Price
  resellerPrice: number; // Wholesale Price
  categoryId: string;
  brandId: string;
  featured?: number;
  image: string;
  images: string[];
}

export interface EcomsellerProductDetail {
  id: string;
  name: string;
  slug: string;
  code: string;
  short: string;
  description: string;
  price: number; // Suggested Sale Price
  resellerPrice: number; // Wholesale Price
  stock: number;
  weight?: number;
  deliveryMode?: string;
  deliverySource?: string;
  deliveryInside?: number;
  deliverySub?: number;
  deliveryOutside?: number;
  deliveryFlat?: number;
  category?: string;
  categorySlug?: string;
  brand?: string;
  images: string[];
}

export interface CategoryMappingRule {
  id?: string;
  supplierId: string;
  supplierCategoryId: string;
  supplierCategoryName: string;
  supplierCategorySlug: string;
  durtupCategoryId: string;
  durtupCategoryName: string;
  durtupCategorySlug: string;
  updatedAt?: string;
}

export interface TieredMarginRule {
  enabled: boolean;
  type: 'fixed' | 'percentage'; // Fixed ৳ or %
  marginValue: number; // e.g., 200 for ৳200 or 15 for 15%
  roundTo99?: boolean;
  minProfit?: number;
  maxProfit?: number;
}

export interface SupplierPricingConfig {
  globalMargin: TieredMarginRule;
  supplierMargins: Record<string, TieredMarginRule>; // supplierId -> Rule
  categoryMargins: Record<string, TieredMarginRule>; // durtupCategorySlug -> Rule
  productMargins: Record<string, TieredMarginRule>;  // productId -> Rule
  updatedAt?: string;
}

export interface SupplierSyncLog {
  id: string;
  supplierId: string;
  supplierName: string;
  actionType: 'catalog_fetch' | 'product_import' | 'product_sync' | 'bulk_sync';
  status: 'success' | 'failed' | 'warning';
  importedCount: number;
  updatedCount: number;
  failedCount: number;
  skippedCount: number;
  message: string;
  details?: any;
  createdAt: string;
}

export interface OrderItemSupplierInfo {
  supplier_id: SupplierSourceId;
  supplier_name: string;
  supplier_sku?: string;
  supplier_product_id?: string;
  supplier_source_url?: string;
  wholesale_price?: number;
  suggested_price?: number;
  supplier_profit?: number;
  durtup_margin?: number;
  fulfillment_status?: 'pending_supplier' | 'order_placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  supplier_order_notes?: string;
}

export interface SupplierFulfillmentGroup {
  supplierId: SupplierSourceId;
  supplierName: string;
  supplierType: 'direct' | 'api' | 'catalog_importer';
  sourceUrl?: string;
  items: Array<{
    id: string;
    product_name: string;
    sku?: string | null;
    quantity: number;
    price: number;
    wholesale_price?: number;
    product_id: string | null;
    product_image?: string;
    variant_name?: string | null;
    supplier_status?: string;
  }>;
  totalQuantity: number;
  totalRetailAmount: number;
  totalWholesaleCost: number;
  estimatedProfit: number;
  overallStatus: string;
}
