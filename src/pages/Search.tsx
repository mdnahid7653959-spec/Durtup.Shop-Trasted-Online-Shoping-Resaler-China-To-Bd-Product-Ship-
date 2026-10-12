import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, X, Clock, TrendingUp, Loader2, Star, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/firebaseAdapter";
import {
  useSearchSuggestions,
  getRecentSearches,
  pushRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "@/hooks/useSearchSuggestions";
import { ImageSearchModal } from "@/components/search/ImageSearchModal";
import { SEOHead } from "@/components/SEOHead";
import { useSmartBack } from "@/hooks/useSmartBack";
import { cn } from "@/lib/utils";

function currency(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

function Highlight({ text, term }: { text: string; term: string }) {
  const q = term.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary font-bold px-0.5 rounded">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

/** Popular = most searched across the whole site (aggregate from search_history) */
function usePopularSearches() {
  return useQuery({
    queryKey: ["popular-searches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_history")
        .select("search_term, query")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const counts = new Map<string, number>();
      (data || []).forEach((r: any) => {
        const raw = (r.search_term || r.query || "").toString().trim();
        if (!raw) return;
        const k = raw.toLowerCase();
        counts.set(k, (counts.get(k) || 0) + 1);
      });
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([term]) => term);
    },
    staleTime: 5 * 60_000,
  });
}

const FALLBACK_TRENDING = [
  "Wireless earbuds",
  "Smart watch",
  "Phone case",
  "LED lights",
  "Summer dress",
  "Sneakers",
  "Backpack",
  "Skincare",
];

export default function SearchPage() {
  const navigate = useNavigate();
  const handleSmartBack = useSmartBack();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || searchParams.get("search") || "";
  const [query, setQuery] = useState(urlQuery);
  const [recent, setRecent] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [imageSearchOpen, setImageSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: suggestions, isFetching } = useSearchSuggestions(query);
  const { data: popular } = usePopularSearches();
  const trending = popular && popular.length ? popular : FALLBACK_TRENDING;

  useEffect(() => {
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    setRecent(getRecentSearches());
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const hasQuery = query.trim().length >= 1;

  const submit = (t: string) => {
    const term = t.trim().replace(/\s+/g, " ");
    if (!term) return;
    pushRecentSearch(term);
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  const removeOne = (t: string) => {
    removeRecentSearch(t);
    setRecent(getRecentSearches());
  };

  const clearAll = () => {
    clearRecentSearches();
    setRecent([]);
    setEditMode(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Search Products" noindex={true} />
      {/* Sticky search header with clean professional white background */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 shadow-xs w-full" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-2.5 px-3 py-2 sm:px-4">
          <button
            type="button"
            aria-label="Back"
            onClick={handleSmartBack}
            className="p-2 rounded-full text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(query);
            }}
            className="flex-1 min-w-0"
          >
            {/* ── Big 3D Liquid Water Droplet Search Bar (বড় পানির ফোঁটা সার্চ বার) ── */}
            <div className={cn(
              "relative flex items-center gap-2.5 rounded-full h-11 px-4 w-full overflow-hidden select-none",
              "bg-gradient-to-b from-white/95 via-white/45 to-white/75 dark:from-white/35 dark:via-white/12 dark:to-white/30",
              "backdrop-blur-md backdrop-saturate-150",
              "border border-slate-200/90 dark:border-white/60",
              "shadow-[0_6px_22px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.03),inset_0_3.5px_6px_rgba(255,255,255,1),inset_0_-2.5px_5px_rgba(0,0,0,0.04),inset_0_0_15px_rgba(255,255,255,0.9)]",
              "dark:shadow-[0_6px_24px_rgba(0,0,0,0.55),inset_0_3.5px_6px_rgba(255,255,255,0.5),inset_0_-2.5px_5px_rgba(0,0,0,0.3)]",
              "focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all"
            )}>
              {/* Top Specular Glare Beam */}
              <div className="absolute top-0.5 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-[0.2px] shadow-[0_0_5px_#ffffff]" />
              
              {/* Primary Micro Sparkle Glint */}
              <div className="absolute top-1.5 right-6 w-2 h-2 rounded-full bg-white shadow-[0_0_5px_#ffffff,0_0_3px_#ffffff]" />

              {/* Bottom Caustic Reflection Arc */}
              <div className="absolute bottom-0.5 inset-x-10 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-[0.3px] shadow-[0_0_4px_rgba(255,255,255,0.95)]" />

              <button
                type="submit"
                aria-label="Search"
                title="Search"
                className="p-1 -ml-1 text-slate-500 dark:text-slate-300 hover:text-orange-600 active:scale-90 transition-all shrink-0 relative z-10 cursor-pointer"
              >
                <SearchIcon className="h-4 w-4" />
              </button>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="flex-1 min-w-0 bg-transparent outline-none border-0 text-sm placeholder:text-slate-400 font-semibold text-slate-900 dark:text-white relative z-10 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
              />
              {isFetching && hasQuery && (
                <Loader2 className="h-4 w-4 animate-spin text-orange-600 shrink-0 relative z-10" />
              )}
              {query && (
                <button
                  type="button"
                  aria-label="Clear"
                  title="Clear"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 relative z-10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Camera Search Button */}
              <button
                type="button"
                aria-label="Search by image"
                title="ছবি দিয়ে খুঁজুন (Search by Image)"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setImageSearchOpen(true);
                }}
                className="p-1 text-slate-500 dark:text-slate-300 hover:text-orange-600 active:scale-90 transition-all shrink-0 relative z-10 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
              </button>

              <button
                type="submit"
                aria-label="Search"
                className="h-7 px-3 rounded-full bg-orange-600 hover:bg-orange-500 active:scale-95 text-white text-xs font-semibold flex items-center transition-all shrink-0 relative z-10 shadow-2xs"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 max-w-2xl mx-auto pb-24">
        {/* Live suggestions */}
        {hasQuery ? (
          <div className="space-y-4">
            {suggestions?.products?.length ? (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
                  Products
                </h3>
                <ul className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/50">
                  {suggestions.products.map((p) => {
                    const price = p.discount_price ?? p.regular_price;
                    return (
                      <li key={p.id}>
                        <Link
                          to={`/product/${p.slug}`}
                          onClick={() => pushRecentSearch(query)}
                          className="flex items-center gap-3 p-2.5 hover:bg-muted/50 transition"
                        >
                          <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
                            {p.image && (
                              <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              <Highlight text={p.name} term={query} />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs">
                              <span className="font-semibold text-foreground">{currency(price)}</span>
                              {p.discount_price && (
                                <span className="text-muted-foreground line-through">
                                  {currency(p.regular_price)}
                                </span>
                              )}
                              {p.rating_average > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {Number(p.rating_average || 4.8).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
                              p.stock_quantity > 0
                                ? "bg-green-500/10 text-green-600"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {p.stock_quantity > 0 ? "In stock" : "Out"}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {suggestions?.categories?.length ? (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/category/${c.slug}`}
                      className="px-3 py-1.5 rounded-full border border-border/70 bg-card text-sm hover:bg-muted"
                    >
                      <Highlight text={c.name} term={query} />
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {!suggestions?.products?.length &&
              !suggestions?.categories?.length &&
              !isFetching && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground mb-3">No results for "{query}"</p>
                  <button
                    onClick={() => submit(query)}
                    className="text-sm text-primary font-semibold"
                  >
                    Search anyway →
                  </button>
                </div>
              )}
          </div>
        ) : (
          <>
            {/* Recent searches with 3D Water Droplets */}
            <section>
              <div className="flex items-center justify-between px-1 mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-600" /> Recent searches
                </h3>
                {recent.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditMode((v) => !v)}
                      className="text-xs font-semibold text-orange-600 hover:underline"
                    >
                      {editMode ? "Done" : "Edit"}
                    </button>
                    {editMode && (
                      <button
                        onClick={clearAll}
                        className="text-xs font-semibold text-destructive hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>
              {recent.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">
                  No recent searches yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {recent.map((t) => (
                    <div
                      key={t}
                      className={cn(
                        "group relative overflow-hidden inline-flex items-center gap-1.5 rounded-full pl-4 pr-2 py-1.5 text-xs sm:text-sm font-bold select-none",
                        "bg-gradient-to-b from-white/95 via-white/45 to-white/75 dark:from-white/35 dark:via-white/12 dark:to-white/30",
                        "backdrop-blur-md border border-white/95 dark:border-white/60 text-slate-900 dark:text-slate-100",
                        "shadow-[0_6px_20px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.05),inset_0_3.5px_6px_rgba(255,255,255,1),inset_0_-2.5px_5px_rgba(0,0,0,0.06),inset_0_0_15px_rgba(255,255,255,0.9)]",
                        "dark:shadow-[0_6px_22px_rgba(0,0,0,0.55),inset_0_3.5px_6px_rgba(255,255,255,0.5),inset_0_-2.5px_5px_rgba(0,0,0,0.3)]",
                        "hover:scale-[1.03] transition-transform"
                      )}
                    >
                      {/* Water Glare Arc & Sparkle */}
                      <div className="absolute top-0.5 left-2.5 w-6 h-[2px] bg-gradient-to-r from-white via-white to-white/70 rounded-full blur-[0.15px] shadow-[0_0_4px_#ffffff]" />
                      <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />
                      <div className="absolute bottom-0.5 inset-x-2 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-[0.3px]" />

                      <button
                        className="truncate max-w-[160px] relative z-10"
                        onClick={() => submit(t)}
                      >
                        {t}
                      </button>
                      <button
                        aria-label={`Remove ${t}`}
                        onClick={() => removeOne(t)}
                        className={cn(
                          "h-5 w-5 grid place-items-center rounded-full text-slate-500 hover:text-destructive hover:bg-destructive/10 transition relative z-10 ml-0.5",
                          editMode ? "opacity-100" : "opacity-0 group-hover:opacity-100 md:opacity-100"
                        )}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Popular / trending searches with Hyper-Realistic 3D Water Droplets (আসল পানির ফোঁটা থিম) */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-3 inline-flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-orange-600" /> Popular on Durtup
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {trending.map((t, i) => (
                  <button
                    key={t}
                    onClick={() => submit(t)}
                    className={cn(
                      "relative overflow-hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold select-none group",
                      "bg-gradient-to-b from-white/95 via-white/45 to-white/75 dark:from-white/35 dark:via-white/12 dark:to-white/30",
                      "backdrop-blur-md border border-white/95 dark:border-white/60 text-slate-900 dark:text-slate-100",
                      "shadow-[0_6px_20px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.05),inset_0_3.5px_6px_rgba(255,255,255,1),inset_0_-2.5px_5px_rgba(0,0,0,0.06),inset_0_0_15px_rgba(255,255,255,0.9)]",
                      "dark:shadow-[0_6px_22px_rgba(0,0,0,0.55),inset_0_3.5px_6px_rgba(255,255,255,0.5),inset_0_-2.5px_5px_rgba(0,0,0,0.3)]",
                      "hover:scale-[1.04] active:scale-95 transition-all"
                    )}
                  >
                    {/* Top Specular Glare Arc */}
                    <div className="absolute top-0.5 left-2.5 w-6 h-[2px] bg-gradient-to-r from-white via-white to-white/70 rounded-full blur-[0.15px] shadow-[0_0_4px_#ffffff]" />
                    
                    {/* Micro Sparkle Dot */}
                    <div className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_#ffffff]" />

                    {/* Bottom Caustic Reflection Arc */}
                    <div className="absolute bottom-0.5 inset-x-2 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full blur-[0.3px]" />

                    <span className="text-[11px] font-black text-orange-600 relative z-10">{i + 1}</span>
                    <span className="relative z-10">{t}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      {/* Image Search Modal */}
      <ImageSearchModal
        open={imageSearchOpen}
        onOpenChange={setImageSearchOpen}
      />
    </div>
  );
}
