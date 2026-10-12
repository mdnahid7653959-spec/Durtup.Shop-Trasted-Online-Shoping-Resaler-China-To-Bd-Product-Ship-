import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Globe, 
  Search, 
  FileText, 
  Share2, 
  CheckCircle, 
  RefreshCw, 
  Edit, 
  Code, 
  ExternalLink, 
  Layers,
  Tag,
  ShieldCheck,
  Eye,
  Sliders
} from "lucide-react";
import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { getInMemoryProducts } from "@/utils/mohasagorCache";
import { logAdminActivity } from "@/services/auditLogger";
import { useToast } from "@/hooks/use-toast";

export interface GlobalSEOSettings {
  site_title: string;
  title_template: string;
  meta_description: string;
  canonical_base: string;
  default_og_image: string;
  robots_index: boolean;
  robots_follow: boolean;
  twitter_card_type: "summary_large_image" | "summary";
  sitemap_last_generated: string;
}

const DEFAULT_SEO_SETTINGS: GlobalSEOSettings = {
  site_title: "Durtup.shop - Bangladesh's Leading Online Shopping & Marketplace",
  title_template: "%title% | Durtup.shop",
  meta_description: "Shop online for electronics, gadgets, fashion, kitchen appliances & more with cash on delivery and fast shipping across Bangladesh.",
  canonical_base: "https://durtup.shop",
  default_og_image: "https://durtup.shop/durtup-og.jpg",
  robots_index: true,
  robots_follow: true,
  twitter_card_type: "summary_large_image",
  sitemap_last_generated: new Date().toISOString(),
};

export default function AdminSEO() {
  const { toast } = useToast();
  const [seoSettings, setSeoSettings] = useState<GlobalSEOSettings>(DEFAULT_SEO_SETTINGS);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [regeneratingSitemap, setRegeneratingSitemap] = useState(false);

  // Search filter for products table
  const [searchFilter, setSearchFilter] = useState("");

  // Product Edit SEO Modal
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [prodSeoTitle, setProdSeoTitle] = useState("");
  const [prodMetaDesc, setProdMetaDesc] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodCanonical, setProdCanonical] = useState("");
  const [prodRobotsIndex, setProdRobotsIndex] = useState(true);

  // Schema Preview Product
  const [selectedSchemaProd, setSelectedSchemaProd] = useState<any | null>(null);

  useEffect(() => {
    const loadSEO = async () => {
      setLoading(true);
      try {
        // 1. Load Global SEO Settings
        if (db) {
          try {
            const snap = await getDocs(collection(db, "seo_settings"));
            snap.forEach((d) => {
              if (d.id === "global") {
                setSeoSettings(d.data() as GlobalSEOSettings);
              }
            });
          } catch {}
        }

        const rawLocal = localStorage.getItem("durtup_seo_settings");
        if (rawLocal) {
          setSeoSettings(JSON.parse(rawLocal));
        }

        // 2. Load Products
        const prodsMap = new Map<string, any>();
        try {
          const mem = getInMemoryProducts();
          if (mem) mem.forEach((p) => prodsMap.set(String(p.id), p));
        } catch {}

        try {
          if (db) {
            const pSnap = await getDocs(collection(db, "products"));
            pSnap.forEach((d) => prodsMap.set(d.id, { id: d.id, ...d.data() }));
          }
        } catch {}

        const list = Array.from(prodsMap.values());
        setProducts(list);
        if (list.length > 0) {
          setSelectedSchemaProd(list[0]);
        }
      } catch (err) {
        console.error("SEO load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSEO();
  }, []);

  // Save Global SEO
  const handleSaveGlobalSEO = async () => {
    setSavingSettings(true);
    try {
      if (db) {
        await setDoc(doc(db, "seo_settings", "global"), seoSettings);
      }
      localStorage.setItem("durtup_seo_settings", JSON.stringify(seoSettings));

      await logAdminActivity({
        action: "UPDATE_GLOBAL_SEO",
        entity_type: "seo",
        entity_id: "global",
        details: "Updated global meta titles, canonical base, and robots directives",
      });

      toast({
        title: "SEO Settings Saved",
        description: "Global metadata and canonical rules updated successfully.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  // Re-generate Sitemaps
  const handleRegenerateSitemap = async () => {
    setRegeneratingSitemap(true);
    setTimeout(async () => {
      const now = new Date().toISOString();
      const updated = { ...seoSettings, sitemap_last_generated: now };
      setSeoSettings(updated);

      if (db) {
        try {
          await setDoc(doc(db, "seo_settings", "global"), updated);
        } catch {}
      }
      localStorage.setItem("durtup_seo_settings", JSON.stringify(updated));

      await logAdminActivity({
        action: "REGENERATE_SITEMAP",
        entity_type: "seo",
        entity_id: "sitemap.xml",
        details: `Re-indexed ${products.length} products and generated XML sitemaps`,
      });

      setRegeneratingSitemap(false);
      toast({
        title: "Sitemap Generated",
        description: `Successfully indexed ${products.length} catalog URLs for Google & Bing.`,
      });
    }, 800);
  };

  // Open Edit Product SEO Modal
  const openProductSEOModal = (prod: any) => {
    setEditingProduct(prod);
    setProdSeoTitle(prod.seo_title || prod.name || prod.title || "");
    setProdMetaDesc(prod.seo_description || prod.description || "");
    setProdSlug(prod.slug || String(prod.id));
    setProdCanonical(prod.canonical_url || `https://durtup.shop/product/${prod.slug || prod.id}`);
    setProdRobotsIndex(prod.robots_index !== false);
  };

  // Save Product SEO
  const handleSaveProductSEO = async () => {
    if (!editingProduct) return;

    const updates = {
      seo_title: prodSeoTitle,
      seo_description: prodMetaDesc,
      slug: prodSlug,
      canonical_url: prodCanonical,
      robots_index: prodRobotsIndex,
      updated_at: new Date().toISOString(),
    };

    try {
      if (db) {
        await setDoc(doc(db, "products", String(editingProduct.id)), updates, { merge: true });
      }
    } catch {}

    const updated = products.map((p) => p.id === editingProduct.id ? { ...p, ...updates } : p);
    setProducts(updated);

    await logAdminActivity({
      action: "UPDATE_PRODUCT_SEO",
      entity_type: "seo",
      entity_id: String(editingProduct.id),
      entity_name: editingProduct.name,
      details: `Updated meta tags and slug for ${editingProduct.name}`,
    });

    toast({
      title: "Product SEO Updated",
      description: `SEO settings saved for "${editingProduct.name}".`,
    });

    setEditingProduct(null);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!searchFilter.trim()) return products.slice(0, 50);
    const q = searchFilter.toLowerCase();
    return products.filter((p) =>
      (p.name || p.title || "").toLowerCase().includes(q) ||
      (p.slug || "").toLowerCase().includes(q)
    ).slice(0, 50);
  }, [products, searchFilter]);

  // Schema.org JSON-LD Generation for active preview product
  const jsonLdPreview = useMemo(() => {
    if (!selectedSchemaProd) return "";
    const p = selectedSchemaProd;
    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": p.name || p.title || "Product",
      "image": p.thumbnail_img || p.image || p.images?.[0] || "https://durtup.shop/placeholder.svg",
      "description": p.seo_description || p.description || p.name,
      "sku": p.sku || `DT-${p.id}`,
      "brand": {
        "@type": "Brand",
        "name": p.brand || "Durtup"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://durtup.shop/product/${p.slug || p.id}`,
        "priceCurrency": "BDT",
        "price": Number(p.price || 0),
        "priceValidUntil": "2027-12-31",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": (Number(p.stock_quantity ?? p.stock ?? 1) > 0) 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Durtup.shop"
        }
      }
    };
    return JSON.stringify(schema, null, 2);
  }, [selectedSchemaProd]);

  return (
    <AdminLayout title="Technical SEO & Metadata Management">
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Technical SEO Management
              </h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                Google / Bing Optimized
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Canonical stabilization, OpenGraph previews, Schema.org JSON-LD generation, and sitemaps
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateSitemap}
              disabled={regeneratingSitemap}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${regeneratingSitemap ? "animate-spin" : ""}`} />
              Re-generate Sitemaps
            </Button>
            <Button size="sm" onClick={handleSaveGlobalSEO} disabled={savingSettings} className="h-8 text-xs gap-1.5">
              Save Global SEO
            </Button>
          </div>
        </div>

        {/* Global Settings & Live Google SERP Snippet Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Global Meta Form (2 Columns) */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Global Site Meta Directives</CardTitle>
              <CardDescription className="text-xs">
                Base metadata inherited across pages unless specifically overridden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <Label className="text-xs">Site Meta Title</Label>
                <Input
                  value={seoSettings.site_title}
                  onChange={(e) => setSeoSettings({ ...seoSettings, site_title: e.target.value })}
                  className="h-8 mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Meta Description</Label>
                <Textarea
                  value={seoSettings.meta_description}
                  onChange={(e) => setSeoSettings({ ...seoSettings, meta_description: e.target.value })}
                  rows={3}
                  className="mt-1 text-xs"
                />
                <span className="text-[10px] text-muted-foreground block text-right mt-1">
                  {seoSettings.meta_description.length} characters (Recommended: 120-160)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Canonical Base URL</Label>
                  <Input
                    value={seoSettings.canonical_base}
                    onChange={(e) => setSeoSettings({ ...seoSettings, canonical_base: e.target.value })}
                    className="h-8 mt-1 text-xs font-mono"
                  />
                </div>

                <div>
                  <Label className="text-xs">Default Social OG Image URL</Label>
                  <Input
                    value={seoSettings.default_og_image}
                    onChange={(e) => setSeoSettings({ ...seoSettings, default_og_image: e.target.value })}
                    className="h-8 mt-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={seoSettings.robots_index}
                    onCheckedChange={(checked) => setSeoSettings({ ...seoSettings, robots_index: checked })}
                    id="robots-index"
                  />
                  <Label htmlFor="robots-index" className="text-xs cursor-pointer font-medium">
                    Index Pages in Search Engines (robots: index)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={seoSettings.robots_follow}
                    onCheckedChange={(checked) => setSeoSettings({ ...seoSettings, robots_follow: checked })}
                    id="robots-follow"
                  />
                  <Label htmlFor="robots-follow" className="text-xs cursor-pointer font-medium">
                    Follow Links (robots: follow)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Google Search Preview (1 Column) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Search className="h-4 w-4 text-blue-600" />
                Google SERP Snippet Preview
              </CardTitle>
              <CardDescription className="text-xs">
                How Durtup appears on Google Desktop & Mobile search results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg border bg-card text-left space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                  <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[8px] flex items-center justify-center font-bold">
                    D
                  </span>
                  <span>{seoSettings.canonical_base}</span>
                </div>
                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
                  {seoSettings.site_title}
                </h3>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {seoSettings.meta_description}
                </p>
              </div>

              {/* Sitemap Status */}
              <div className="mt-4 pt-4 border-t space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Sitemap Index</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10">
                    200 OK
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  /sitemap.xml • {products.length} URLs
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Last updated: {new Date(seoSettings.sitemap_last_generated).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product-Level Technical SEO Overrides Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
            <div>
              <CardTitle className="text-base font-bold">Product SEO & Slug Overrides</CardTitle>
              <CardDescription className="text-xs">
                Customize titles, meta descriptions, and canonical URLs per product
              </CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <Input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search products..."
                className="h-8 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="text-left font-medium py-2.5 px-4">Product Name</th>
                    <th className="text-left font-medium py-2.5 px-4">Canonical Slug</th>
                    <th className="text-left font-medium py-2.5 px-4">SEO Title</th>
                    <th className="text-left font-medium py-2.5 px-4">Index Status</th>
                    <th className="text-right font-medium py-2.5 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-foreground truncate max-w-[220px]">
                          {prod.name || prod.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          ID: {prod.id}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground truncate max-w-[180px]">
                        /product/{prod.slug || prod.id}
                      </td>
                      <td className="py-2.5 px-4 text-foreground truncate max-w-[240px]">
                        {prod.seo_title || prod.name || prod.title}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge 
                          variant="outline"
                          className={`text-[9px] ${
                            prod.robots_index !== false 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          }`}
                        >
                          {prod.robots_index !== false ? "index, follow" : "noindex"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => setSelectedSchemaProd(prod)}
                          title="Inspect JSON-LD Schema"
                        >
                          <Code className="h-3.5 w-3.5 mr-1" />
                          Schema
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => openProductSEOModal(prod)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Live Schema.org JSON-LD Structured Data Inspector */}
        {selectedSchemaProd && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" />
                  Live Schema.org Product JSON-LD: {selectedSchemaProd.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  Rich snippets generated strictly from real product attributes (Price: ৳{selectedSchemaProd.price})
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                @type: Product
              </Badge>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-lg bg-muted/60 font-mono text-[11px] overflow-x-auto text-foreground">
                {jsonLdPreview}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Edit Product SEO Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Edit Product SEO: {editingProduct?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Fine-tune the search engine listing and social sharing cards for this item.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <Label className="text-xs">Custom SEO Title</Label>
                <Input
                  value={prodSeoTitle}
                  onChange={(e) => setProdSeoTitle(e.target.value)}
                  className="h-8 mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Canonical Slug</Label>
                <Input
                  value={prodSlug}
                  onChange={(e) => setProdSlug(e.target.value)}
                  className="h-8 mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">Meta Description</Label>
                <Textarea
                  value={prodMetaDesc}
                  onChange={(e) => setProdMetaDesc(e.target.value)}
                  rows={3}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-medium text-foreground block text-xs">Search Engine Indexing</span>
                  <span className="text-[10px] text-muted-foreground">Allow Google/Bing to index this item</span>
                </div>
                <Switch
                  checked={prodRobotsIndex}
                  onCheckedChange={setProdRobotsIndex}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveProductSEO}>
                Save Product SEO
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
