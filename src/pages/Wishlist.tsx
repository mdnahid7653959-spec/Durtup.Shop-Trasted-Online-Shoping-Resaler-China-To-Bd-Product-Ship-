import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Search, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export default function Wishlist() {
  const navigate = useNavigate();
  const { items, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  const filteredItems = items.filter((item) =>
    (item.product?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = async (item: any) => {
    const id = item.product?.id || item.product_id;
    setAddingId(id);
    try {
      const price = item.product?.discount_price || item.product?.regular_price || 0;
      await addToCart(
        {
          id: id,
          name: item.product?.name || "Product",
          slug: item.product?.slug || `product-${id}`,
          price: price,
          originalPrice: item.product?.regular_price,
          image: item.image || item.product?.image_url || item.product?.thumbnail,
          stock: item.product?.stock_quantity ?? 50,
        },
        1
      );
      toast.success("Added to cart!");
    } catch (err: any) {
      console.error("Error adding wishlist item to cart:", err);
      toast.error(err.message || "Could not add to cart");
    } finally {
      setAddingId(null);
    }
  };

  const handleOrderNow = async (item: any) => {
    const id = item.product?.id || item.product_id;
    setAddingId(id);
    try {
      const price = item.product?.discount_price || item.product?.regular_price || 0;
      await addToCart(
        {
          id: id,
          name: item.product?.name || "Product",
          slug: item.product?.slug || `product-${id}`,
          price: price,
          originalPrice: item.product?.regular_price,
          image: item.image || item.product?.image_url || item.product?.thumbnail,
          stock: item.product?.stock_quantity ?? 50,
        },
        1
      );
      navigate("/checkout");
    } catch (err: any) {
      console.error("Error ordering wishlist item:", err);
      navigate("/checkout");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-6 sm:py-10">
        <div className="container max-w-7xl px-4 sm:px-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary fill-primary/20" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Wishlist</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} saved in your wishlist
              </p>
            </div>

            {items.length > 0 && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm bg-card"
                />
              </div>
            )}
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
              <p className="text-sm">Loading your saved items...</p>
            </div>
          ) : items.length === 0 ? (
            <Card className="border-dashed bg-card/50">
              <CardContent className="py-16 sm:py-20 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5 text-primary">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-primary stroke-[1.5]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Your wishlist is empty</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Save items you love by clicking the heart icon on any product. They'll appear here for easy access anytime.
                </p>
                <Button asChild size="lg" className="rounded-xl shadow-md font-semibold gap-2">
                  <Link to="/products">
                    Explore Products <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No products match "{searchQuery}"</p>
              <Button variant="link" size="sm" onClick={() => setSearchQuery("")} className="mt-1">
                Clear search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
              {filteredItems.map((item) => {
                const regularPrice = item.product?.regular_price || 0;
                const discountPrice = item.product?.discount_price;
                const currentPrice = discountPrice || regularPrice;
                const hasDiscount = !!discountPrice && discountPrice < regularPrice;
                const discountPercent = hasDiscount
                  ? Math.round(((regularPrice - discountPrice) / regularPrice) * 100)
                  : 0;

                return (
                  <Card
                    key={item.id}
                    className="group overflow-hidden rounded-xl border hover:shadow-lg transition-all duration-200 bg-card flex flex-col"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-square bg-muted/40 overflow-hidden">
                      <Link to={`/product/${item.product?.slug || item.product_id}`} className="block w-full h-full">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.product?.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-10 h-10 stroke-[1.5]" />
                          </div>
                        )}
                      </Link>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFromWishlist(item.product_id || item.id || item.product?.id);
                        }}
                        className="absolute top-2 right-2 w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 hover:bg-destructive hover:text-white dark:hover:bg-destructive text-slate-600 dark:text-slate-300 rounded-full shadow-md border border-slate-200/80 dark:border-slate-700 transition-all z-20 touch-manipulation active:scale-90"
                        title="Remove from wishlist"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Discount Badge */}
                      {hasDiscount && discountPercent > 0 && (
                        <Badge className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-[10px] sm:text-xs px-1.5 py-0.5 shadow-sm border-0">
                          {discountPercent}% OFF
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <Link
                          to={`/product/${item.product?.slug || item.product_id}`}
                          className="font-medium text-xs sm:text-sm line-clamp-2 hover:text-primary transition-colors leading-snug"
                        >
                          {item.product?.name || "Product"}
                        </Link>

                        <div className="flex items-baseline gap-1.5 mt-2 flex-wrap">
                          <span className="font-bold text-sm sm:text-base text-primary">
                            ৳{Number(currentPrice).toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] sm:text-xs text-muted-foreground line-through">
                              ৳{Number(regularPrice).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 pt-2 border-t flex flex-col gap-1.5">
                        <Button
                          size="sm"
                          className="w-full text-xs font-bold h-8"
                          onClick={() => handleOrderNow(item)}
                          disabled={addingId === item.product_id}
                        >
                          Order Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-7 gap-1 font-medium"
                          onClick={() => handleAddToCart(item)}
                          disabled={addingId === item.product_id}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
