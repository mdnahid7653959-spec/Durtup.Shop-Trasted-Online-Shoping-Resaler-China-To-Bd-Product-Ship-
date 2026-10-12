import { EcomsellerEngine } from "./ecomsellerEngine";
import { getCachedMohasagorProducts, interleaveCatalogs, updateIndexMap, setIdbProducts } from "@/utils/mohasagorCache";

export interface EcomsellerSyncAnalysis {
  timestamp: string;
  totalLiveProducts: number;
  newProductsCount: number;
  priceChangesCount: number;
  updatedProductsCount: number;
  newProducts: Array<{ id: string; name: string; code: string; price: number }>;
  priceChanges: Array<{ id: string; name: string; oldPrice: number; newPrice: number }>;
  status: "success" | "warning" | "idle" | "error";
  message: string;
}

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const LAST_SYNC_KEY = "ecomseller_auto_sync_analysis_v1";

class EcomsellerAutoSyncService {
  private timer: number | null = null;
  private isSyncing = false;
  private lastAnalysis: EcomsellerSyncAnalysis | null = null;
  private isInitialized = false;

  constructor() {
    this.loadLastAnalysis();
  }

  private loadLastAnalysis() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LAST_SYNC_KEY);
      if (saved) {
        this.lastAnalysis = JSON.parse(saved);
      }
    } catch {}
  }

  private saveAnalysis(analysis: EcomsellerSyncAnalysis) {
    this.lastAnalysis = analysis;
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LAST_SYNC_KEY, JSON.stringify(analysis));
      window.dispatchEvent(new CustomEvent("ecomseller_sync_completed", { detail: analysis }));
    } catch {}
  }

  /**
   * Initialize the 5-minute recurring background sync and product analyzer
   */
  public init() {
    if (typeof window === "undefined") return;
    if (this.isInitialized) return;
    this.isInitialized = true;

    const SIX_HOURS = 6 * 60 * 60 * 1000;
    const lastTime = this.lastAnalysis?.timestamp ? new Date(this.lastAnalysis.timestamp).getTime() : 0;
    const isStale = !lastTime || (Date.now() - lastTime > SIX_HOURS);

    if (isStale) {
      // Defer sync to idle time so initial rendering and interactions are never blocked
      const runIdle = () => {
        this.runSyncAndAnalysis().catch((err) => {
          console.warn("[Ecomseller AutoSync] Background sync warning:", err);
        });
      };
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(runIdle, { timeout: 8000 });
      } else {
        window.setTimeout(runIdle, 6000);
      }
    }

    // Setup recurring interval with staleness check
    this.timer = window.setInterval(() => {
      const now = Date.now();
      const last = this.lastAnalysis?.timestamp ? new Date(this.lastAnalysis.timestamp).getTime() : 0;
      if (!last || now - last > SIX_HOURS) {
        this.runSyncAndAnalysis().catch((err) => {
          console.warn("[Ecomseller AutoSync] Recurring sync error:", err);
        });
      }
    }, SYNC_INTERVAL_MS);
  }

  /**
   * Run sync, analyze changes from live link, and merge into Durtup store catalog
   */
  public async runSyncAndAnalysis(force = false): Promise<EcomsellerSyncAnalysis> {
    if (this.isSyncing) {
      return (
        this.lastAnalysis || {
          timestamp: new Date().toISOString(),
          totalLiveProducts: 0,
          newProductsCount: 0,
          priceChangesCount: 0,
          updatedProductsCount: 0,
          newProducts: [],
          priceChanges: [],
          status: "idle",
          message: "Sync already in progress...",
        }
      );
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      console.log("[Ecomseller AutoSync] 🔄 Polling and analyzing live catalog from Ecomseller BD...");

      // 1. Get previous cached products for comparison
      const previousUnified = await EcomsellerEngine.getCachedEcomsellerProducts(false);
      const prevMap = new Map<string, any>();
      previousUnified.forEach((p) => {
        const code = String(p.supplier_sku || p.id || "").replace(/^ecom-/, "");
        if (code) prevMap.set(code, p);
        if (p.slug) prevMap.set(p.slug, p);
      });

      // 2. Fetch fresh live catalog directly from Ecomseller BD
      const freshCatalog = await EcomsellerEngine.fetchLiveCatalog(true);
      const liveProducts = freshCatalog.products || [];

      // 3. Convert to unified format
      const freshUnified = EcomsellerEngine.convertCatalogToUnified(freshCatalog);

      // 4. Analyze differences (new products, price changes, updates)
      const newProducts: Array<{ id: string; name: string; code: string; price: number }> = [];
      const priceChanges: Array<{ id: string; name: string; oldPrice: number; newPrice: number }> = [];
      let updatedProductsCount = 0;

      freshUnified.forEach((freshProd) => {
        const code = String(freshProd.supplier_sku || freshProd.id || "").replace(/^ecom-/, "");
        const prev = prevMap.get(code) || prevMap.get(freshProd.slug);

        if (!prev) {
          // Newly added product
          newProducts.push({
            id: freshProd.id,
            name: freshProd.name,
            code: code,
            price: freshProd.price,
          });
        } else {
          // Check price changes
          if (prev.price !== freshProd.price || prev.regular_price !== freshProd.regular_price) {
            priceChanges.push({
              id: freshProd.id,
              name: freshProd.name,
              oldPrice: prev.price,
              newPrice: freshProd.price,
            });
          }
        }
      });

      // 5. Update index map & IDB with merged catalogs
      const mohasagorProducts = await getCachedMohasagorProducts();
      const combinedAll = interleaveCatalogs(mohasagorProducts, freshUnified);

      updateIndexMap(combinedAll);
      setIdbProducts(combinedAll).catch(() => {});

      const analysis: EcomsellerSyncAnalysis = {
        timestamp: new Date().toISOString(),
        totalLiveProducts: freshUnified.length,
        newProductsCount: newProducts.length,
        priceChangesCount: priceChanges.length,
        updatedProductsCount: newProducts.length + priceChanges.length,
        newProducts,
        priceChanges,
        status: "success",
        message: `Analysis complete: ${freshUnified.length} live products analyzed (${newProducts.length} new, ${priceChanges.length} price changes) in ${Date.now() - startTime}ms`,
      };

      this.saveAnalysis(analysis);

      // 6. Notify the application to update UI live
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("ecomseller_products_updated"));
        window.dispatchEvent(new Event("mohasagor_products_updated"));
        window.dispatchEvent(new Event("durtup_products_updated"));
      }

      console.log(`[Ecomseller AutoSync] ✅ ${analysis.message}`);
      return analysis;
    } catch (err: any) {
      console.error("[Ecomseller AutoSync] ❌ Sync error:", err);
      const errorAnalysis: EcomsellerSyncAnalysis = {
        timestamp: new Date().toISOString(),
        totalLiveProducts: 0,
        newProductsCount: 0,
        priceChangesCount: 0,
        updatedProductsCount: 0,
        newProducts: [],
        priceChanges: [],
        status: "error",
        message: `Sync failed: ${err.message || "Unknown error"}`,
      };
      this.saveAnalysis(errorAnalysis);
      return errorAnalysis;
    } finally {
      this.isSyncing = false;
    }
  }

  public getLastAnalysis(): EcomsellerSyncAnalysis | null {
    return this.lastAnalysis;
  }

  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isSyncing: this.isSyncing,
      lastSyncTimestamp: this.lastAnalysis?.timestamp || null,
      lastSyncMessage: this.lastAnalysis?.message || "No sync performed yet",
    };
  }
}

export const EcomsellerAutoSync = new EcomsellerAutoSyncService();
