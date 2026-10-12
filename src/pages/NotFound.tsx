import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { CATEGORIES_DATA } from "@/data/categoriesData";
import { Search, Home, ShoppingBag, ArrowRight, PackageSearch, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NotFound = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Page Not Found (404) | Durtup.shop Bangladesh"
        description="The page you are looking for might have been removed, had its name changed, or is temporarily unavailable. Search over 3,000+ products on Durtup.shop."
        noindex={true}
        url="https://durtup.shop/404"
      />

      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-xl w-full text-center space-y-6 bg-card border rounded-3xl p-6 sm:p-10 shadow-sm">
          
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto">
            <PackageSearch className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-black text-foreground tracking-tight">404</h1>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Oops! This Page Could Not Be Found
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              The product or page you are looking for might have moved, been renamed, or is temporarily unavailable.
            </p>
          </div>

          {/* Quick Search Form */}
          <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
            <Input
              type="search"
              placeholder="Search 3,000+ gadgets, watches, fashion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-11 rounded-full text-sm"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1 top-1 bottom-1 rounded-full px-4 h-9"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Popular Category Shortcuts */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Explore Popular Categories in Bangladesh
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES_DATA.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary transition-colors border text-foreground font-medium"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-4 border-t flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground text-xs sm:text-sm font-bold hover:bg-muted transition-colors border"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>View All Products</span>
            </Link>

            <Link
              to="/help"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card text-muted-foreground text-xs sm:text-sm font-medium hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Need Help?</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
