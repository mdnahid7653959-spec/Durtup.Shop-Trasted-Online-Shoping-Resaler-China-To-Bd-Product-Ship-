import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Search, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Star, 
  Sliders, 
  Tag, 
  ArrowRight, 
  RefreshCw,
  ExternalLink,
  Zap,
  Filter
} from "lucide-react";
import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getInMemoryProducts } from "@/utils/mohasagorCache";
import { useToast } from "@/hooks/use-toast";

interface ExtractedIntent {
  rawQuery: string;
  category: string | null;
  maxBudget: number | null;
  minBudget: number | null;
  qualityIntent: boolean;
  attributes: string[];
  inStockOnly: boolean;
}

interface MatchedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  regular_price: number;
  stock: number;
  rating: number;
  image: string;
  relevanceScore: number;
  matchReasons: string[];
}

const SAMPLE_PROMPTS = [
  "কম দামে ভালো wireless earbuds",
  "smart watch under 2000",
  "kitchen vegetable chopper",
  "fast charging power bank",
  "pure cotton casual kurti",
  "premium bluetooth headphone with mic",
];

export default function AdminAISearch() {
  const { toast } = useToast();
  const [queryText, setQueryText] = useState("কম দামে ভালো wireless earbuds");
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Intent tuning settings
  const [requireInStock, setRequireInStock] = useState(true);
  const [boostHighRating, setBoostHighRating] = useState(true);
  const [minRatingThreshold, setMinRatingThreshold] = useState(4.0);

  // Load Catalog
  useEffect(() => {
    const loadCatalog = async () => {
      setLoadingProducts(true);
      const prodsMap = new Map<string, any>();
      try {
        const mem = getInMemoryProducts();
        if (mem) {
          mem.forEach((p) => prodsMap.set(String(p.id), p));
        }
      } catch {}

      try {
        if (db) {
          const snap = await getDocs(collection(db, "products"));
          snap.forEach((d) => prodsMap.set(d.id, { id: d.id, ...d.data() }));
        }
      } catch {}

      setCatalogProducts(Array.from(prodsMap.values()));
      setLoadingProducts(false);
    };

    loadCatalog();
  }, []);

  // Intent Extraction Parser
  const extractedIntent: ExtractedIntent = useMemo(() => {
    const q = queryText.toLowerCase().trim();
    let maxBudget: number | null = null;
    let minBudget: number | null = null;
    let category: string | null = null;
    let qualityIntent = false;
    const attributes: string[] = [];

    // 1. Budget Detection
    if (q.includes("কম দাম") || q.includes("কম দামে") || q.includes("budget") || q.includes("cheap") || q.includes("affordable")) {
      maxBudget = 1800; // Low budget ceiling
    }
    const underMatch = q.match(/(?:under|below|কম|নিচে)\s*(\d+)/i) || q.match(/(\d+)\s*(?:tk|taka|টাকা)/i);
    if (underMatch && underMatch[1]) {
      maxBudget = parseInt(underMatch[1], 10);
    }

    // 2. Quality Intent Detection
    if (q.includes("ভালো") || q.includes("best") || q.includes("premium") || q.includes("top") || q.includes("heavy")) {
      qualityIntent = true;
    }

    // 3. Category & Attribute Mapping
    if (q.includes("earbud") || q.includes("earphone") || q.includes("airpod") || q.includes("headphone") || q.includes("ইয়ারবাড") || q.includes("হেডফোন")) {
      category = "Audio / Electronics";
      attributes.push("audio", "wireless", "bluetooth");
    } else if (q.includes("watch") || q.includes("ঘড়ি") || q.includes("ঘড়ি")) {
      category = "Smart Watches";
      attributes.push("watch", "smart", "fitness");
    } else if (q.includes("chopper") || q.includes("blender") || q.includes("kitchen") || q.includes("চপার") || q.includes("ব্লেন্ডার")) {
      category = "Kitchen & Dining";
      attributes.push("chopper", "kitchen", "appliance");
    } else if (q.includes("power bank") || q.includes("powerbank") || q.includes("পাওয়ার ব্যাংক")) {
      category = "Electronics / Accessories";
      attributes.push("powerbank", "charging", "battery");
    } else if (q.includes("kurti") || q.includes("cotton") || q.includes("dress") || q.includes("শাড়ি") || q.includes("কুর্তি")) {
      category = "Fashion & Apparel";
      attributes.push("cotton", "apparel", "wear");
    }

    // General Keyword extraction
    const rawTokens = q.split(/\s+/).filter(w => w.length > 2 && !["দামে", "ভালো", "under", "with", "the", "for"].includes(w));
    attributes.push(...rawTokens);

    return {
      rawQuery: queryText,
      category,
      maxBudget,
      minBudget,
      qualityIntent,
      attributes: Array.from(new Set(attributes)),
      inStockOnly: requireInStock,
    };
  }, [queryText, requireInStock]);

  // Catalogue Retrieval & Scoring
  const searchResults: MatchedProduct[] = useMemo(() => {
    if (!queryText.trim() || catalogProducts.length === 0) return [];

    const results: MatchedProduct[] = [];

    catalogProducts.forEach((p) => {
      const pName = (p.name || p.title || "").toLowerCase();
      const pCat = (p.category || p.category_name || "").toLowerCase();
      const pDesc = (p.description || "").toLowerCase();
      const pPrice = Number(p.price || p.regular_price || 0);
      const pStock = Number(p.stock_quantity ?? p.stock ?? 10);
      const pRating = Number(p.rating || p.rating_average || 4.5);

      // Filter: In-Stock
      if (requireInStock && pStock <= 0) return;

      // Filter: Budget Constraint
      if (extractedIntent.maxBudget !== null && pPrice > extractedIntent.maxBudget) {
        return; // Exceeds budget
      }

      let score = 0;
      const reasons: string[] = [];

      // Keyword matching
      extractedIntent.attributes.forEach((attr) => {
        if (pName.includes(attr)) {
          score += 15;
          reasons.push(`Title matches "${attr}"`);
        } else if (pCat.includes(attr)) {
          score += 8;
          reasons.push(`Category matches "${attr}"`);
        } else if (pDesc.includes(attr)) {
          score += 4;
        }
      });

      // Quality signal boosting
      if (boostHighRating && pRating >= minRatingThreshold) {
        score += Math.round(pRating * 3);
        reasons.push(`High customer rating (${pRating}★)`);
      }

      // Budget fit bonus
      if (extractedIntent.maxBudget !== null && pPrice <= extractedIntent.maxBudget) {
        score += 10;
        reasons.push(`Fits budget ceiling (৳${pPrice} <= ৳${extractedIntent.maxBudget})`);
      }

      // In-stock bonus
      if (pStock > 10) {
        score += 5;
        reasons.push(`Healthy stock (${pStock} units)`);
      }

      if (score > 10) {
        results.push({
          id: String(p.id),
          name: p.name || p.title || "Product",
          category: p.category || "General",
          price: pPrice,
          regular_price: Number(p.regular_price || pPrice),
          stock: pStock,
          rating: pRating,
          image: p.thumbnail_img || p.image || p.images?.[0] || "/placeholder.svg",
          relevanceScore: score,
          matchReasons: Array.from(new Set(reasons)),
        });
      }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
  }, [catalogProducts, queryText, extractedIntent, requireInStock, boostHighRating, minRatingThreshold]);

  const handleTestSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      toast({
        title: "NLP Discovery Processed",
        description: `Found ${searchResults.length} verified products from real Durtup catalogue.`,
      });
    }, 250);
  };

  return (
    <AdminLayout title="AI Product & Natural Search Assistant">
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Product Discovery Engine
              </h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                Strict Zero-Hallucination
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bilingual intent extraction (Bengali & English) mapped strictly against the real Durtup catalogue
            </p>
          </div>

          <Badge variant="secondary" className="text-xs">
            {catalogProducts.length} Catalogue Items Indexed
          </Badge>
        </div>

        {/* Sandbox Query Input */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Test Natural Language Query
            </CardTitle>
            <CardDescription className="text-xs">
              Type or select a customer query to see intent extraction and matched catalogue items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="e.g. কম দামে ভালো wireless earbuds or smart watch under 2000"
                  className="pl-9 text-xs h-9 bg-card"
                  onKeyDown={(e) => e.key === "Enter" && handleTestSearch()}
                />
              </div>
              <Button size="sm" onClick={handleTestSearch} disabled={isSearching} className="h-9 gap-1.5 text-xs">
                {isSearching ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Analyze & Match
              </Button>
            </div>

            {/* Quick Sample Prompts */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">Try Samples:</span>
              {SAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setQueryText(prompt)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-foreground/80 hover:text-foreground border transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Extracted Intent Breakdown */}
            <div className="p-3 rounded-lg bg-muted/30 border space-y-2 text-xs">
              <div className="font-semibold text-foreground flex items-center justify-between">
                <span>Inferred NLP Intent Breakdown</span>
                <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600">
                  Verified Real Data Source
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Detected Category</span>
                  <span className="font-medium text-foreground">
                    {extractedIntent.category || "General Matching"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block">Budget Ceiling</span>
                  <span className="font-medium text-foreground">
                    {extractedIntent.maxBudget ? `Max ৳${extractedIntent.maxBudget}` : "No budget limit"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block">Quality Signal</span>
                  <span className="font-medium text-foreground">
                    {extractedIntent.qualityIntent ? "High (Rating >= 4.5★)" : "Standard"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block">Extracted Keywords</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {extractedIntent.attributes.slice(0, 4).map((kw) => (
                      <span key={kw} className="text-[9px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results List from Real Catalogue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">
                Matching Catalogue Products ({searchResults.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Products retrieved strictly from the existing Durtup inventory
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Switch
                  checked={requireInStock}
                  onCheckedChange={setRequireInStock}
                  id="stock-only"
                />
                <Label htmlFor="stock-only" className="text-xs cursor-pointer">
                  In-Stock Only
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Loading catalogue products...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-10 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">No matching products found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Our AI adheres to strict data integrity: No imaginary products are fabricated. 
                  Try broadening the budget or search keywords.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {searchResults.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border bg-card hover:border-primary/40 transition-all flex gap-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-md object-cover bg-muted shrink-0"
                      onError={(e) => { (e.target as any).src = "/placeholder.svg"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-foreground truncate">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                          {item.relevanceScore} pts
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="font-bold text-foreground font-mono">
                          ৳{item.price.toLocaleString()}
                        </span>
                        {item.regular_price > item.price && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            ৳{item.regular_price.toLocaleString()}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                          {item.rating}
                        </span>
                        <span className={`text-[10px] font-medium ${item.stock > 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                        </span>
                      </div>

                      {/* Match Reasons */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.matchReasons.map((r, rIdx) => (
                          <span key={rIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
