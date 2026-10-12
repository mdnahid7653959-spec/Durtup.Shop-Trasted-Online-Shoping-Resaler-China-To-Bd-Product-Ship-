import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/firebaseAdapter";
import { 
  Globe, Settings, Percent, DollarSign, Activity, 
  CheckCircle2, XCircle, AlertCircle, Trash2, Edit, 
  Plus, RefreshCw, Play, Link2, ShieldCheck, HelpCircle,
  TrendingUp, Clock, AlertTriangle, ArrowRight, ArrowLeft,
  Terminal, ShieldAlert, Cpu, Sparkles, Check, Database, Eye,
  Loader2, Calculator, Save, DownloadCloud, ExternalLink,
  Layers, Package, ShoppingBag, Search, Filter, Image as ImageIcon,
  CheckSquare, Square
} from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  EcomsellerEngine, 
  parseTssResponse 
} from "@/services/suppliers/ecomsellerEngine";
import { 
  EcomsellerRawProduct, 
  EcomsellerRawCategory, 
  EcomsellerRawBrand, 
  EcomsellerProductDetail,
  SupplierSyncLog,
  CategoryMappingRule,
  SupplierPricingConfig,
  TieredMarginRule
} from "@/services/suppliers/supplierTypes";
import { 
  CategoryMappingService, 
  DURTUP_MASTER_CATEGORIES,
  DurtupMasterCategory
} from "@/services/suppliers/categoryMappingService";
import { SupplierManager } from "@/services/suppliers/supplierManager";

export default function AdminSupplierImport() {
  const { toast } = useToast();
  const { admin } = useAdminAuth();

  // Active supplier tab
  const [activeSupplier, setActiveSupplier] = useState<string>("ecomseller_bd");
  const suppliers = SupplierManager.getRegisteredSuppliers();

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [catalogProducts, setCatalogProducts] = useState<EcomsellerRawProduct[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<EcomsellerRawCategory[]>([]);
  const [catalogBrands, setCatalogBrands] = useState<EcomsellerRawBrand[]>([]);
  const [importedSkuSet, setImportedSkuSet] = useState<Set<string>>(new Set());
  const [syncLogs, setSyncLogs] = useState<SupplierSyncLog[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [filterImportStatus, setFilterImportStatus] = useState<string>("all"); // 'all' | 'imported' | 'not_imported'

  // Selection for bulk action
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Progress Bar for Bulk Actions
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressText, setProgressText] = useState("");

  // Product Preview Dialog
  const [previewProduct, setPreviewProduct] = useState<EcomsellerRawProduct | null>(null);
  const [previewDetail, setPreviewDetail] = useState<EcomsellerProductDetail | null>(null);
  const [loadingPreviewDetail, setLoadingPreviewDetail] = useState(false);
  const [previewActiveImgIdx, setPreviewActiveImgIdx] = useState(0);
  const [customOverrideCategory, setCustomOverrideCategory] = useState<string>("");
  const [customOverrideMargin, setCustomOverrideMargin] = useState<number | null>(null);

  // Category Mappings State
  const [categoryMappings, setCategoryMappings] = useState<CategoryMappingRule[]>([]);
  const [savingMappings, setSavingMappings] = useState(false);

  // Pricing Config State
  const [pricingConfig, setPricingConfig] = useState<SupplierPricingConfig>(EcomsellerEngine.getPricingConfig());
  const [savingPricing, setSavingPricing] = useState(false);

  // Simulator State
  const [simBasePrice, setSimBasePrice] = useState<number>(1000);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // 1. Fetch live catalog
      const catalog = await EcomsellerEngine.fetchLiveCatalog(forceRefresh);
      setCatalogProducts(catalog.products || []);
      setCatalogCategories(catalog.categories || []);
      setCatalogBrands(catalog.brands || []);

      // 2. Fetch existing imported products from DB to mark status
      const { data: dbProds } = await supabase
        .from("products")
        .select("sku, supplier_sku")
        .eq("supplier_id", EcomsellerEngine.SUPPLIER_ID);

      const skuSet = new Set<string>();
      dbProds?.forEach((p: any) => {
        if (p.sku) skuSet.add(p.sku);
        if (p.supplier_sku) skuSet.add(`ECOM-${p.supplier_sku}`);
      });
      setImportedSkuSet(skuSet);

      // 3. Load Category Mappings
      const mappings = await CategoryMappingService.getSupplierMappings(EcomsellerEngine.SUPPLIER_ID);
      setCategoryMappings(mappings);

      // 4. Load Pricing Rules
      const pricing = EcomsellerEngine.getPricingConfig();
      setPricingConfig(pricing);

      // 5. Load Sync Logs
      const { data: logs } = await supabase
        .from("supplier_sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      setSyncLogs(logs || []);

    } catch (err: any) {
      toast({
        title: "Catalog load error",
        description: err.message || "Failed to load supplier catalog",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter(p => {
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.code.includes(searchQuery);

      const matchesCat = selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchesBrand = selectedBrand === "all" || p.brandId === selectedBrand;

      const isImported = importedSkuSet.has(`ECOM-${p.code}`);
      let matchesStatus = true;
      if (filterImportStatus === "imported") matchesStatus = isImported;
      if (filterImportStatus === "not_imported") matchesStatus = !isImported;

      return matchesSearch && matchesCat && matchesBrand && matchesStatus;
    });
  }, [catalogProducts, searchQuery, selectedCategory, selectedBrand, filterImportStatus, importedSkuSet]);

  // Open Preview Modal
  const handleOpenPreview = async (product: EcomsellerRawProduct) => {
    setPreviewProduct(product);
    setPreviewActiveImgIdx(0);
    setCustomOverrideMargin(null);
    setLoadingPreviewDetail(true);

    const defaultMapped = CategoryMappingService.resolveCategory(
      product.slug,
      product.name,
      categoryMappings
    );
    setCustomOverrideCategory(defaultMapped.slug);

    try {
      const detail = await EcomsellerEngine.fetchProductDetail(product.slug);
      setPreviewDetail(detail);
      if (detail?.categorySlug) {
        const mapped = CategoryMappingService.resolveCategory(
          detail.categorySlug,
          detail.category || product.name,
          categoryMappings
        );
        setCustomOverrideCategory(mapped.slug);
      }
    } catch (e) {
      console.warn("Detail fetch warning:", e);
    }
    setLoadingPreviewDetail(false);
  };

  // Import Single Product
  const handleImportSingle = async (product: EcomsellerRawProduct) => {
    setIsProcessing(true);
    setProgressText(`Importing "${product.name}"...`);
    const res = await EcomsellerEngine.importProduct(product, {
      fetchFullDetail: true,
      customCategorySlug: customOverrideCategory || undefined
    });

    if (res.success) {
      toast({
        title: "Import Successful!",
        description: res.message
      });
      setImportedSkuSet(prev => new Set(prev).add(`ECOM-${product.code}`));
      setPreviewProduct(null);
    } else {
      toast({
        title: "Import Failed",
        description: res.message,
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

  // Bulk Import Selected
  const handleBulkImportSelected = async () => {
    if (selectedProducts.size === 0) {
      toast({ title: "No products selected", description: "Select one or more products to import." });
      return;
    }

    const toImport = catalogProducts.filter(p => selectedProducts.has(p.id));
    setIsProcessing(true);
    setProgressPercent(0);

    const log = await EcomsellerEngine.bulkImport(toImport, (cur, tot, name) => {
      setProgressPercent(Math.round((cur / tot) * 100));
      setProgressText(`Importing ${cur}/${tot}: ${name}`);
    });

    toast({
      title: "Bulk Import Finished!",
      description: log.message
    });

    // Refresh status
    loadAllData();
    setSelectedProducts(new Set());
    setIsProcessing(false);
  };

  // Sync All Existing Imported Products
  const handleSyncAllImported = async () => {
    setIsProcessing(true);
    setProgressPercent(0);
    setProgressText("Starting synchronization with live catalog...");

    const log = await EcomsellerEngine.syncImportedProducts((cur, tot, name) => {
      setProgressPercent(Math.round((cur / tot) * 100));
      setProgressText(`Syncing ${cur}/${tot}: ${name}`);
    });

    toast({
      title: "Sync Finished!",
      description: log.message
    });

    loadAllData();
    setIsProcessing(false);
  };

  // Toggle selection
  const toggleSelectProduct = (id: string) => {
    const next = new Set(selectedProducts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProducts(next);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Category mapping update
  const handleCategoryMappingChange = (supplierCatSlug: string, supplierCatName: string, durtupSlug: string) => {
    const durtupCat = DURTUP_MASTER_CATEGORIES.find(c => c.slug === durtupSlug) || DURTUP_MASTER_CATEGORIES[0];
    
    setCategoryMappings(prev => {
      const existingIdx = prev.findIndex(m => m.supplierCategorySlug === supplierCatSlug);
      const newRule: CategoryMappingRule = {
        supplierId: EcomsellerEngine.SUPPLIER_ID,
        supplierCategoryId: supplierCatSlug,
        supplierCategoryName: supplierCatName,
        supplierCategorySlug: supplierCatSlug,
        durtupCategoryId: durtupCat.id,
        durtupCategoryName: durtupCat.name,
        durtupCategorySlug: durtupCat.slug
      };

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newRule;
        return updated;
      } else {
        return [...prev, newRule];
      }
    });
  };

  const handleSaveCategoryMappings = async () => {
    setSavingMappings(true);
    const success = await CategoryMappingService.saveMappings(categoryMappings, EcomsellerEngine.SUPPLIER_ID);
    if (success) {
      toast({
        title: "Category Mappings Saved!",
        description: "All supplier category mappings have been successfully updated."
      });
    } else {
      toast({ variant: "destructive", title: "Error", description: "Failed to save category mappings." });
    }
    setSavingMappings(false);
  };

  // Pricing rules update
  const handleSavePricing = async () => {
    setSavingPricing(true);
    const success = await EcomsellerEngine.savePricingConfig(pricingConfig);
    if (success) {
      toast({
        title: "Margin Rules Saved!",
        description: "Custom profit margin rules updated. Prices will calculate automatically on import/sync."
      });
    } else {
      toast({ variant: "destructive", title: "Error", description: "Failed to save margin settings." });
    }
    setSavingPricing(false);
  };

  // Simulator calculation
  const simResult = useMemo(() => {
    return EcomsellerEngine.calculatePrice(simBasePrice, undefined, undefined, pricingConfig);
  }, [simBasePrice, pricingConfig]);

  return (
    <AdminLayout title="Supplier Product Import & Sync">
      <div className="flex flex-col gap-6 p-2 md:p-6 max-w-7xl mx-auto">
        
        {/* Header Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-600 text-white font-semibold gap-1">
                <Sparkles className="h-3 w-3" /> Supplier Hub
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">Catalog Import & Sync Center</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Supplier Product Import</h1>
            <p className="text-muted-foreground text-xs md:text-sm max-w-2xl">
              Import and synchronize products from external catalog sources into Durtup's unified database with custom profit margins and category mapping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadAllData(true)} 
              disabled={loading || isProcessing}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Catalog
            </Button>
            <Button 
              size="sm" 
              onClick={handleSyncAllImported} 
              disabled={loading || isProcessing || importedSkuSet.size === 0}
              className="bg-orange-600 hover:bg-orange-500 text-white gap-2"
            >
              <DownloadCloud className="h-3.5 w-3.5" /> Sync Store Products ({importedSkuSet.size})
            </Button>
          </div>
        </div>

        {/* Supplier Source Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {suppliers.map(sup => (
            <div
              key={sup.id}
              onClick={() => setActiveSupplier(sup.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all flex items-center justify-between ${
                activeSupplier === sup.id 
                  ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20 shadow-sm" 
                  : "border-border/60 bg-card/60 hover:border-border hover:bg-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-lg font-bold text-base ${
                  activeSupplier === sup.id ? "bg-orange-600 text-white" : "bg-muted text-foreground"
                }`}>
                  {sup.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{sup.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{sup.statusText}</p>
                </div>
              </div>
              {activeSupplier === sup.id && (
                <CheckCircle2 className="h-5 w-5 text-orange-600" />
              )}
            </div>
          ))}
        </div>

        {/* Processing Progress Bar */}
        {isProcessing && (
          <Card className="border-orange-500/30 bg-orange-500/5 shadow-md">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-orange-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> {progressText || "Processing products..."}
                </span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-orange-500/20" />
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="catalog" className="w-full space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto h-auto p-1 bg-muted/60">
            <TabsTrigger value="catalog" className="gap-2 py-2">
              <ShoppingBag className="h-4 w-4" /> Live Catalog ({catalogProducts.length})
            </TabsTrigger>
            <TabsTrigger value="mapping" className="gap-2 py-2">
              <Layers className="h-4 w-4" /> Category Mapping ({catalogCategories.length})
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2 py-2">
              <Percent className="h-4 w-4" /> Margin Rules
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 py-2">
              <Activity className="h-4 w-4" /> Sync Logs ({syncLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: LIVE CATALOG BROWSER & IMPORTER */}
          <TabsContent value="catalog" className="space-y-4">
            
            {/* Catalog Source Info Card */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-card/60">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Source URL:</span>{" "}
                  <a 
                    href={EcomsellerEngine.CATALOG_URL} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs font-mono font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {EcomsellerEngine.CATALOG_URL} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>Total Catalog: <strong className="text-foreground">{catalogProducts.length}</strong></div>
                <div className="h-4 w-[1px] bg-border" />
                <div>In Store: <strong className="text-emerald-600">{importedSkuSet.size}</strong></div>
                <div className="h-4 w-[1px] bg-border" />
                <div>New Available: <strong className="text-orange-600">{Math.max(0, catalogProducts.length - importedSkuSet.size)}</strong></div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input 
                  placeholder="Search product name or code..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories ({catalogCategories.length})</SelectItem>
                  {catalogCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands ({catalogBrands.length})</SelectItem>
                  {catalogBrands.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterImportStatus} onValueChange={setFilterImportStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Import Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_imported">Ready to Import ({Math.max(0, catalogProducts.length - importedSkuSet.size)})</SelectItem>
                  <SelectItem value="imported">Already in Store ({importedSkuSet.size})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Selection Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-1">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleSelectAll}
                  className="text-xs gap-1.5"
                >
                  {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-orange-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  {selectedProducts.size === filteredProducts.length ? "Deselect All" : "Select All"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Selected <strong>{selectedProducts.size}</strong> of {filteredProducts.length} items
                </span>
              </div>

              {selectedProducts.size > 0 && (
                <Button 
                  size="sm" 
                  onClick={handleBulkImportSelected}
                  disabled={isProcessing}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold gap-2"
                >
                  <DownloadCloud className="h-3.5 w-3.5" /> Import Selected ({selectedProducts.size})
                </Button>
              )}
            </div>

            {/* Products Table */}
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-10">Select</TableHead>
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Product Info</TableHead>
                      <TableHead>Supplier Category</TableHead>
                      <TableHead className="text-right">Wholesale Cost</TableHead>
                      <TableHead className="text-right">Suggested Sale</TableHead>
                      <TableHead className="text-right">Supplier Profit</TableHead>
                      <TableHead className="text-right">Durtup Margin</TableHead>
                      <TableHead className="text-right">Durtup Final Price</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-16">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                            <p className="text-sm font-semibold">Loading Ecomseller BD Catalog...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-16 text-muted-foreground text-sm">
                          No products found matching filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map(prod => {
                        const isImported = importedSkuSet.has(`ECOM-${prod.code}`);
                        const isSelected = selectedProducts.has(prod.id);
                        const categoryObj = catalogCategories.find(c => c.id === prod.categoryId);
                        const brandObj = catalogBrands.find(b => b.id === prod.brandId);

                        const calculated = EcomsellerEngine.calculatePrice(
                          prod.price, 
                          categoryObj?.slug, 
                          prod.id, 
                          pricingConfig
                        );

                        const supplierProfit = Math.max(0, prod.price - prod.resellerPrice);

                        return (
                          <TableRow key={prod.id} className={isSelected ? "bg-orange-500/5" : ""}>
                            <TableCell>
                              <button 
                                onClick={() => toggleSelectProduct(prod.id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {isSelected ? (
                                  <CheckSquare className="h-4 w-4 text-orange-600" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                            </TableCell>
                            <TableCell>
                              <div className="h-12 w-12 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                                {prod.image ? (
                                  <img src={prod.image} alt={prod.name} className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="font-bold text-sm line-clamp-1">{prod.name}</div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">#{prod.code}</span>
                                {brandObj && <span>Brand: {brandObj.name}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px] font-normal">
                                {categoryObj?.name || "General"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              ৳{prod.resellerPrice}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-xs text-foreground">
                              ৳{prod.price}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-emerald-600 font-semibold">
                              +৳{supplierProfit}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-blue-600 font-semibold">
                              +৳{calculated.durtupMargin}
                            </TableCell>
                            <TableCell className="text-right font-mono font-black text-sm text-orange-600">
                              ৳{calculated.finalSellingPrice}
                            </TableCell>
                            <TableCell className="text-center">
                              {isImported ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px] gap-1">
                                  <Check className="h-3 w-3" /> In Store
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">
                                  Ready
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOpenPreview(prod)}
                                className="h-8 text-xs gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" /> Preview
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleImportSingle(prod)}
                                disabled={isProcessing}
                                className="h-8 text-xs bg-orange-600 hover:bg-orange-500 text-white"
                              >
                                {isImported ? "Update" : "Import"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: CATEGORY MAPPING MANAGER */}
          <TabsContent value="mapping" className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
                <div>
                  <CardTitle className="text-base font-bold">Category Mapping Engine</CardTitle>
                  <CardDescription className="text-xs">
                    Map supplier source categories from Ecomseller BD to Durtup.shop master categories.
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleSaveCategoryMappings} 
                  disabled={savingMappings}
                  className="bg-orange-600 hover:bg-orange-500 text-white text-xs gap-2"
                >
                  <Save className="h-3.5 w-3.5" /> Save Category Mappings
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Supplier Category (Ecomseller BD)</TableHead>
                      <TableHead>Category Slug</TableHead>
                      <TableHead>Items Count</TableHead>
                      <TableHead className="w-10 text-center">→</TableHead>
                      <TableHead>Mapped Durtup.shop Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {catalogCategories.map(cat => {
                      const currentMapped = CategoryMappingService.resolveCategory(
                        cat.slug, 
                        cat.name, 
                        categoryMappings
                      );

                      const count = catalogProducts.filter(p => p.categoryId === cat.id).length;

                      return (
                        <TableRow key={cat.id}>
                          <TableCell className="font-semibold text-sm">
                            {cat.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {cat.slug}
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            <Badge variant="secondary">{count} products</Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold text-muted-foreground">→</TableCell>
                          <TableCell>
                            <Select 
                              value={currentMapped.slug} 
                              onValueChange={(val) => handleCategoryMappingChange(cat.slug, cat.name, val)}
                            >
                              <SelectTrigger className="w-64 h-9 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DURTUP_MASTER_CATEGORIES.map(dc => (
                                  <SelectItem key={dc.id} value={dc.slug}>
                                    {dc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: CUSTOM PROFIT MARGIN RULES */}
          <TabsContent value="pricing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Margin Settings Card */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Percent className="h-4 w-4 text-orange-500" /> Supplier Margin Configuration
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure your profit margin on top of Ecomseller BD's Suggested Sale Price.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  
                  {/* Supplier Margin Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Enable Custom Margin</Label>
                      <p className="text-xs text-muted-foreground">Add profit margin on all imported products</p>
                    </div>
                    <Switch 
                      checked={pricingConfig.supplierMargins[EcomsellerEngine.SUPPLIER_ID]?.enabled ?? true}
                      onCheckedChange={(checked) => {
                        setPricingConfig(prev => ({
                          ...prev,
                          supplierMargins: {
                            ...prev.supplierMargins,
                            [EcomsellerEngine.SUPPLIER_ID]: {
                              ...(prev.supplierMargins[EcomsellerEngine.SUPPLIER_ID] || { type: 'fixed', marginValue: 150 }),
                              enabled: checked
                            }
                          }
                        }));
                      }}
                    />
                  </div>

                  {/* Margin Type */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Margin Calculation Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={pricingConfig.supplierMargins[EcomsellerEngine.SUPPLIER_ID]?.type === 'fixed' ? 'default' : 'outline'}
                        onClick={() => {
                          setPricingConfig(prev => ({
                            ...prev,
                            supplierMargins: {
                              ...prev.supplierMargins,
                              [EcomsellerEngine.SUPPLIER_ID]: {
                                ...(prev.supplierMargins[EcomsellerEngine.SUPPLIER_ID] || { enabled: true, marginValue: 150 }),
                                type: 'fixed'
                              }
                            }
                          }));
                        }}
                        className={pricingConfig.supplierMargins[EcomsellerEngine.SUPPLIER_ID]?.type === 'fixed' ? 'bg-orange-600 text-white' : ''}
                      >
                        Fixed Amount (৳)
                      </Button>
                      <Button
                        type="button"
                        variant={pricingConfig.supplierMargins[EcomsellerEngine.SUPPLIER_ID]?.type === 'percentage' ? 'default' : 'outline'}
                        onClick={() => {
                          setPricingConfig(prev => ({
                            ...prev,
                            supplierMargins: {
                              ...prev.supplierMargins,
                              [EcomsellerEngine.SUPPLIER_ID]: {
                                ...(prev.supplierMargins[EcomsellerEngine.SUPPLIER_ID] || { enabled: true, marginValue: 15 }),
                                type: 'percentage'
                              }
                            }
                          }));
                        }}
                        className={pricingConfig.supplierMargins[EcomsellerEngine.SUPPLIER_ID]?.type === 'percentage' ? 'bg-orange-600 text-white' : ''}
                      >
                        Percentage Margin (%)
                      </Button>
                    </div>
                  </div>

                  {/* Margin Value */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      {pricingConfig.supplierMargins[EcomsellerEngine.SUPPLIER_ID]?.type === 'percentage'
                        ? "Profit Margin Percentage (%)"
                        : "Fixed Profit Margin (৳)"}
                    </Label>
                    <div className="relative">
                      <Input 
                        type="number"
                        value={pricingConfig.supplierMargins[EcomsellerEngine.SUPPLIER_ID]?.marginValue ?? 150}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setPricingConfig(prev => ({
                            ...prev,
                            supplierMargins: {
                              ...prev.supplierMargins,
                              [EcomsellerEngine.SUPPLIER_ID]: {
                                ...(prev.supplierMargins[EcomsellerEngine.SUPPLIER_ID] || { enabled: true, type: 'fixed' }),
                                marginValue: val
                              }
                            }
                          }));
                        }}
                        className="font-mono text-base pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">
                        {pricingConfig.supplierMargins[EcomsellerEngine.SUPPLIER_ID]?.type === 'percentage' ? "%" : "৳"}
                      </span>
                    </div>
                  </div>

                  {/* Psychological .99 Rounding */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Psychological .99 Price Ending</Label>
                      <p className="text-xs text-muted-foreground">e.g. ৳980 becomes ৳999, ৳1485 becomes ৳1499</p>
                    </div>
                    <Switch 
                      checked={pricingConfig.supplierMargins[EcomsellerEngine.SUPPLIER_ID]?.roundTo99 ?? false}
                      onCheckedChange={(checked) => {
                        setPricingConfig(prev => ({
                          ...prev,
                          supplierMargins: {
                            ...prev.supplierMargins,
                            [EcomsellerEngine.SUPPLIER_ID]: {
                              ...(prev.supplierMargins[EcomsellerEngine.SUPPLIER_ID] || { enabled: true, type: 'fixed', marginValue: 150 }),
                              roundTo99: checked
                            }
                          }
                        }));
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSavePricing} 
                    disabled={savingPricing}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold gap-2"
                  >
                    <Save className="h-4 w-4" /> Save Profit Margin Rules
                  </Button>
                </CardFooter>
              </Card>

              {/* Live Simulator Card */}
              <Card className="border-border/60 shadow-sm flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-500" /> Interactive Price Simulator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Preview how customer selling prices will be calculated live on your storefront.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Test Base Suggested Price (৳)</Label>
                    <Input 
                      type="number" 
                      value={simBasePrice} 
                      onChange={e => setSimBasePrice(Math.max(0, Number(e.target.value)))}
                      className="font-mono text-base"
                    />
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Supplier Suggested Price:</span>
                      <span className="font-mono font-bold">৳{simResult.baseSuggestedPrice}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Durtup Added Margin:</span>
                      <span className="font-mono font-bold text-blue-600">+৳{simResult.durtupMargin}</span>
                    </div>
                    <div className="h-[1px] bg-border" />
                    <div className="flex justify-between text-sm items-center">
                      <span className="font-bold">Customer Final Selling Price:</span>
                      <span className="font-mono font-black text-xl text-orange-600">৳{simResult.finalSellingPrice}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Regular Crossed-Out Price:</span>
                      <span className="font-mono line-through">৳{simResult.regularStrikethroughPrice}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Customer Privacy Guarantee
                    </div>
                    <p>
                      Wholesale costs and internal margins are completely excluded from public storefront APIs. Customers only see <strong>৳{simResult.finalSellingPrice}</strong>.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  Applied Rule Level: <Badge variant="outline" className="ml-1 uppercase text-[10px]">{simResult.appliedRuleLevel}</Badge>
                </CardFooter>
              </Card>

            </div>
          </TabsContent>

          {/* TAB 4: SYNC LOGS */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-base font-bold">Supplier Synchronization Audit</CardTitle>
                  <CardDescription className="text-xs">
                    Complete history of product imports, sync jobs, and error logs.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => loadAllData()} className="gap-2">
                  <RefreshCw className="h-3 w-3" /> Refresh Logs
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Imported</TableHead>
                      <TableHead className="text-center">Updated</TableHead>
                      <TableHead className="text-center">Failed</TableHead>
                      <TableHead>Summary / Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                          No sync logs recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      syncLogs.map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {new Date(l.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {l.actionType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {l.status === 'success' ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px]">
                                Success
                              </Badge>
                            ) : l.status === 'warning' ? (
                              <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px]">
                                Partial Warning
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/20 text-[10px]">
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-xs">{l.importedCount}</TableCell>
                          <TableCell className="text-center font-mono font-bold text-xs">{l.updatedCount}</TableCell>
                          <TableCell className="text-center font-mono font-bold text-xs text-rose-600">{l.failedCount}</TableCell>
                          <TableCell className="text-xs max-w-md truncate">{l.message}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PRODUCT PREVIEW DIALOG */}
        <Dialog open={Boolean(previewProduct)} onOpenChange={(open) => !open && setPreviewProduct(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            {previewProduct && (
              <div className="space-y-6">
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-600 text-white font-mono text-[10px]">
                      #{previewProduct.code}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Ecomseller BD Catalog Item</span>
                  </div>
                  <DialogTitle className="text-xl font-bold mt-1">{previewProduct.name}</DialogTitle>
                </DialogHeader>

                {/* Media & Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Image Gallery */}
                  <div className="space-y-3">
                    <div className="aspect-square rounded-xl border overflow-hidden bg-muted flex items-center justify-center">
                      {previewDetail?.images?.[previewActiveImgIdx] || previewProduct.images?.[previewActiveImgIdx] || previewProduct.image ? (
                        <img 
                          src={previewDetail?.images?.[previewActiveImgIdx] || previewProduct.images?.[previewActiveImgIdx] || previewProduct.image} 
                          alt={previewProduct.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>

                    {/* Thumbnails */}
                    {((previewDetail?.images && previewDetail.images.length > 1) || (previewProduct.images && previewProduct.images.length > 1)) && (
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                        {(previewDetail?.images || previewProduct.images).map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPreviewActiveImgIdx(idx)}
                            className={`h-12 w-12 rounded-lg border-2 overflow-hidden transition ${
                              idx === previewActiveImgIdx ? "border-orange-600 ring-2 ring-orange-500/20" : "border-border opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img src={img} alt={`Thumb ${idx}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Economics & Mapping Configuration */}
                  <div className="space-y-4">
                    
                    {/* Economics Breakdown */}
                    <div className="p-4 rounded-xl border bg-muted/30 space-y-2.5 text-xs">
                      <div className="font-bold text-foreground uppercase tracking-wider text-[11px] pb-1 border-b">
                        Price & Margin Breakdown
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supplier Wholesale Cost:</span>
                        <span className="font-mono font-bold text-foreground">৳{previewDetail?.resellerPrice || previewProduct.resellerPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Suggested Sale Base:</span>
                        <span className="font-mono font-bold text-foreground">৳{previewDetail?.price || previewProduct.price}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Supplier Profit Margin:</span>
                        <span className="font-mono">+৳{Math.max(0, (previewDetail?.price || previewProduct.price) - (previewDetail?.resellerPrice || previewProduct.resellerPrice))}</span>
                      </div>
                      <div className="flex justify-between text-blue-600 font-semibold">
                        <span>Durtup Added Profit:</span>
                        <span className="font-mono">
                          +৳{EcomsellerEngine.calculatePrice(previewDetail?.price || previewProduct.price, customOverrideCategory, previewProduct.id, pricingConfig).durtupMargin}
                        </span>
                      </div>
                      <div className="h-[1px] bg-border pt-1" />
                      <div className="flex justify-between text-sm items-center font-bold">
                        <span>Final Storefront Price:</span>
                        <span className="font-mono font-black text-lg text-orange-600">
                          ৳{EcomsellerEngine.calculatePrice(previewDetail?.price || previewProduct.price, customOverrideCategory, previewProduct.id, pricingConfig).finalSellingPrice}
                        </span>
                      </div>
                    </div>

                    {/* Durtup Target Category Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Target Durtup Category</Label>
                      <Select value={customOverrideCategory} onValueChange={setCustomOverrideCategory}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURTUP_MASTER_CATEGORIES.map(c => (
                            <SelectItem key={c.id} value={c.slug}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Stock & Delivery Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg border bg-card">
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Stock Available</span>
                        <strong className="text-emerald-600">{previewDetail?.stock || 50} units</strong>
                      </div>
                      <div className="p-2.5 rounded-lg border bg-card">
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Inside Dhaka Delivery</span>
                        <strong>৳{previewDetail?.deliveryInside || 70}</strong>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Description Preview */}
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Product Description Preview
                  </Label>
                  {loadingPreviewDetail ? (
                    <div className="py-6 flex justify-center items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> Fetching full Bengali description...
                    </div>
                  ) : previewDetail?.description ? (
                    <div 
                      className="p-4 rounded-xl border bg-muted/20 text-xs max-h-48 overflow-y-auto leading-relaxed prose-sm"
                      dangerouslySetInnerHTML={{ __html: previewDetail.description }}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No extended description available.</p>
                  )}
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button variant="outline" onClick={() => setPreviewProduct(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleImportSingle(previewProduct)}
                    disabled={isProcessing}
                    className="bg-orange-600 hover:bg-orange-500 text-white font-semibold gap-2"
                  >
                    <DownloadCloud className="h-4 w-4" /> 
                    {importedSkuSet.has(`ECOM-${previewProduct.code}`) ? "Update Product in Durtup Store" : "Import Product to Durtup Store"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}
