import { SupplierMeta, SupplierFulfillmentGroup } from "./supplierTypes";
import { EcomsellerEngine } from "./ecomsellerEngine";

export class SupplierManager {
  /**
   * Get all registered supplier sources
   */
  public static getRegisteredSuppliers(): SupplierMeta[] {
    return [
      {
        id: "durtup",
        name: "Durtup Direct Inventory",
        type: "direct",
        isActive: true,
        statusText: "In-House Warehouse"
      },
      {
        id: "dropshipping_bd",
        name: "Dropshipping.com.bd",
        type: "api",
        apiBaseUrl: "https://mohasagor.com.bd",
        isActive: true,
        statusText: "API Connected"
      },
      {
        id: EcomsellerEngine.SUPPLIER_ID,
        name: EcomsellerEngine.SUPPLIER_NAME,
        type: "catalog_importer",
        sourceUrl: EcomsellerEngine.CATALOG_URL,
        isActive: true,
        statusText: "Master Catalog Source"
      }
    ];
  }

  /**
   * Organize raw order items into Multi-Supplier Fulfillment Groups
   */
  public static groupOrderItemsBySupplier(orderItems: any[]): SupplierFulfillmentGroup[] {
    if (!Array.isArray(orderItems) || orderItems.length === 0) return [];

    const groupsMap = new Map<string, SupplierFulfillmentGroup>();

    for (const item of orderItems) {
      let supplierId = item.supplier_id;
      let supplierName = item.supplier_name || item.seller_id;
      let supplierType: 'direct' | 'api' | 'catalog_importer' = 'direct';

      // Detect supplier if not explicitly set
      const sku = String(item.sku || "").toUpperCase();
      const prodName = String(item.product_name || item.name || "");

      if (supplierId === "ecomseller_bd" || sku.startsWith("ECOM-") || supplierName?.toLowerCase().includes("ecomseller")) {
        supplierId = "ecomseller_bd";
        supplierName = "Ecomseller BD";
        supplierType = "catalog_importer";
      } else if (
        supplierId === "mohasagor" || 
        supplierId === "dropshipping_bd" || 
        sku.startsWith("MOH-") || 
        supplierName?.toLowerCase().includes("mohasagor") ||
        supplierName?.toLowerCase().includes("dropshipping")
      ) {
        supplierId = "dropshipping_bd";
        supplierName = "Dropshipping.com.bd";
        supplierType = "api";
      } else if (prodName.startsWith("[CJ]") || sku.startsWith("CJ-")) {
        supplierId = "cj_dropshipping";
        supplierName = "CJ Dropshipping";
        supplierType = "api";
      } else {
        supplierId = "durtup";
        supplierName = "Durtup Direct";
        supplierType = "direct";
      }

      if (!groupsMap.has(supplierId)) {
        groupsMap.set(supplierId, {
          supplierId,
          supplierName,
          supplierType,
          sourceUrl: supplierId === "ecomseller_bd" ? EcomsellerEngine.CATALOG_URL : undefined,
          items: [],
          totalQuantity: 0,
          totalRetailAmount: 0,
          totalWholesaleCost: 0,
          estimatedProfit: 0,
          overallStatus: "Pending Fulfillment"
        });
      }

      const group = groupsMap.get(supplierId)!;
      const qty = Number(item.quantity) || 1;
      const retailPrice = Number(item.price) || 0;
      const wholesaleCost = Number(item.wholesale_price) || (retailPrice * 0.75);

      group.items.push({
        id: item.id || `it-${Math.random()}`,
        product_name: item.product_name || item.name || "Product",
        sku: item.sku || (item.supplier_sku ? `ECOM-${item.supplier_sku}` : null),
        quantity: qty,
        price: retailPrice,
        wholesale_price: wholesaleCost,
        product_id: item.product_id || item.id,
        product_image: item.product_image || item.image || null,
        variant_name: item.variant_name || item.variant_id || null,
        supplier_status: item.fulfillment_status || "Pending"
      });

      group.totalQuantity += qty;
      group.totalRetailAmount += retailPrice * qty;
      group.totalWholesaleCost += wholesaleCost * qty;
      group.estimatedProfit += (retailPrice - wholesaleCost) * qty;
    }

    return Array.from(groupsMap.values());
  }
}
