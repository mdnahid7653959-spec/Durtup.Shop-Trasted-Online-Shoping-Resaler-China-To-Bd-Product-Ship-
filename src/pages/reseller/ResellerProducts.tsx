import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ResellerLayout } from "@/components/reseller/ResellerLayout";
import { ResellerService, ResellerProduct } from "@/services/resellerService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ResellerProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"margin" | "price_asc" | "price_desc">("margin");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Profit Calculator Modal State
  const [calcProduct, setCalcProduct] = useState<ResellerProduct | null>(null);
  const [calcCustomPrice, setCalcCustomPrice] = useState<number>(0);
  const [calcDeliveryFee, setCalcDeliveryFee] = useState<number>(70);

  // Image Preview & Download Modal State
  const [imageModalProduct, setImageModalProduct] = useState<ResellerProduct | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string>("");

  useEffect(() => {
    ResellerService.getProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.banglaName && p.banglaName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === "margin") return b.suggestedProfit - a.suggestedProfit;
        if (sortBy === "price_asc") return a.wholesalePrice - b.wholesalePrice;
        if (sortBy === "price_desc") return b.wholesalePrice - a.wholesalePrice;
        return 0;
      });
  }, [products, searchTerm, selectedCategory, sortBy]);

  const handleCopyCaption = (product: ResellerProduct) => {
    navigator.clipboard.writeText(product.banglaDescription);
    setCopiedId(product.id);
    toast({
      title: "ক্যাপশন কপি হয়েছে",
      description: "ফেসবুকে পোস্ট করার জন্য বাংলা ক্যাপশন ক্লিপবোর্ডে কপি হয়েছে।",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const openCalculator = (product: ResellerProduct) => {
    setCalcProduct(product);
    setCalcCustomPrice(product.mrp);
  };

  const openImageModal = (product: ResellerProduct) => {
    setImageModalProduct(product);
    setSelectedPreviewImage(product.image || (product.images && product.images[0]) || "");
  };

  const handleDownloadSingleImage = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    link.click();
    toast({ title: "ছবি ডাউনলোড হচ্ছে..." });
  };

  const handleDownloadAllImages = (product: ResellerProduct) => {
    const imgs = product.images && product.images.length > 0 ? product.images : [product.image];
    imgs.forEach((img, idx) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = img;
        link.download = `${product.slug}-photo-${idx + 1}.jpg`;
        link.target = "_blank";
        link.click();
      }, idx * 400);
    });
    toast({
      title: "সব ছবি ডাউনলোড হচ্ছে...",
      description: `মোট ${imgs.length}টি ফটো ডাউনলোড করা হচ্ছে।`,
    });
  };

  return (
    <ResellerLayout>
      <SEOHead title="হোলসেল রিসেলিং ক্যাটালগ - Durtup Reseller" />

      <div className="space-y-4">
        
        {/* 1. Smooth Executive Hero Card (No Emojis, No Cluttered Icons) */}
        <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              হোলসেল হাব
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              রিসেলিং হোলসেল ক্যাটালগ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              পাইকারি মূল্যে পণ্য সংগ্রহ করুন এবং আপনার নির্ধারিত লাভে কাস্টমারের কাছে সরাসরি ডেলিভারি করান।
            </p>
          </div>

          <Button 
            asChild 
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs sm:text-sm h-10 px-5 shrink-0 self-start md:self-auto transition-colors"
          >
            <Link to="/reseller/orders/new">
              নতুন কাস্টমার অর্ডার দিন
            </Link>
          </Button>
        </div>

        {/* 2. Filter, Search & Category Tabs */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Input
                placeholder="প্রোডাক্টের নাম বা কোড দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border-slate-200 dark:border-slate-800 text-xs sm:text-sm h-10 bg-slate-50/50 dark:bg-slate-800/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  মুছুন
                </button>
              )}
            </div>

            {/* Sort Dropdown (No Emojis) */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">সর্ট:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="margin">সর্বোচ্চ প্রফিট (Max Profit)</option>
                <option value="price_asc">পাইকারি রেট: কম থেকে বেশি</option>
                <option value="price_desc">পাইকারি রেট: বেশি থেকে কম</option>
              </select>
            </div>

          </div>

          {/* Clean Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cat === "all" ? "সকল ক্যাটাগরি" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Product Grid (2 columns on mobile, clean cards without floating icon clutter) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              {/* Product Top Image Area (No floating circular buttons) */}
              <div>
                <div 
                  className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
                  onClick={() => openImageModal(product)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Clean Profit Tag (No Sparkle Icon) */}
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    লাভ: ৳{product.suggestedProfit.toLocaleString("en-IN")}
                  </div>

                  {/* Clean Stock Tag */}
                  <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[9px] sm:text-[10px] font-medium px-2 py-0.5 rounded-md">
                    স্টক: {product.stock}+
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-2.5 sm:p-3 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                    {product.category}
                  </span>
                  
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {product.banglaName || product.name}
                  </h3>

                  {/* Clean Pricing Table */}
                  <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1 text-xs border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium text-[11px]">পাইকারি:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">৳{product.wholesalePrice.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>MRP:</span>
                      <span className="line-through font-medium">৳{product.mrp.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <span>সম্ভাব্য প্রফিট:</span>
                      <span>+৳{product.suggestedProfit.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Action Buttons (Text-only, no icon clutter) */}
              <div className="p-2.5 sm:p-3 pt-0 space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    onClick={() => handleCopyCaption(product)}
                    variant="outline"
                    size="sm"
                    className="text-[11px] font-semibold rounded-lg h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {copiedId === product.id ? "কপি হয়েছে" : "ক্যাপশন কপি"}
                  </Button>

                  <Button
                    onClick={() => openCalculator(product)}
                    variant="outline"
                    size="sm"
                    className="text-[11px] font-semibold rounded-lg h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    হিসাব
                  </Button>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg h-8.5 text-xs transition-colors"
                >
                  <Link to={`/reseller/orders/new?product=${product.id}`}>
                    কাস্টমার অর্ডার করুন
                  </Link>
                </Button>
              </div>

            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              অনুগ্রহ করে অন্য কোনো কি-ওয়ার্ড দিয়ে সার্চ করুন।
            </p>
            <Button
              onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg text-xs font-semibold"
            >
              সব প্রোডাক্ট দেখুন
            </Button>
          </div>
        )}

      </div>

      {/* 4. Profit Calculator Dialog */}
      <Dialog open={!!calcProduct} onOpenChange={(open) => !open && setCalcProduct(null)}>
        <DialogContent className="max-w-md rounded-2xl p-5 sm:p-6 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              প্রফিট মার্জিন ক্যালকুলেটর
            </DialogTitle>
          </DialogHeader>

          {calcProduct && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                <img 
                  src={calcProduct.image} 
                  alt={calcProduct.name} 
                  className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" 
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{calcProduct.banglaName || calcProduct.name}</h4>
                  <div className="flex items-center gap-3 mt-0.5 text-slate-500">
                    <span>হোলসেল: <b className="text-slate-800 dark:text-slate-200">৳{calcProduct.wholesalePrice.toLocaleString("en-IN")}</b></span>
                    <span>MRP: <b className="text-slate-800 dark:text-slate-200">৳{calcProduct.mrp.toLocaleString("en-IN")}</b></span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  আপনি কাস্টমারের কাছে কত টাকায় বিক্রি করবেন? (৳)
                </label>
                <Input
                  type="number"
                  value={calcCustomPrice}
                  onChange={(e) => setCalcCustomPrice(Number(e.target.value))}
                  className="rounded-lg font-bold text-base text-slate-900 h-10 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ডেলিভারি এলাকা
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcDeliveryFee(70)}
                    className={`p-2.5 rounded-lg border text-center font-semibold text-xs transition-all ${
                      calcDeliveryFee === 70 
                        ? "border-slate-900 bg-slate-900 text-white" 
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    ঢাকার ভিতরে (৳৭০)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcDeliveryFee(130)}
                    className={`p-2.5 rounded-lg border text-center font-semibold text-xs transition-all ${
                      calcDeliveryFee === 130 
                        ? "border-slate-900 bg-slate-900 text-white" 
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    ঢাকার বাইরে (৳১৩০)
                  </button>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/60 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>কাস্টমার মোট বিল (COD):</span>
                  <span className="font-bold text-slate-900 dark:text-white">৳{(calcCustomPrice + calcDeliveryFee).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>পাইকারি মূল্য কর্তন:</span>
                  <span className="font-bold text-slate-900">-৳{calcProduct.wholesalePrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-emerald-600">
                  <span>আপনার নিশ্চিত প্রফিট:</span>
                  <span className="text-base font-extrabold">
                    ৳{Math.max(0, calcCustomPrice - calcProduct.wholesalePrice).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <Button
                asChild
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg h-10 text-xs"
              >
                <Link to={`/reseller/orders/new?product=${calcProduct.id}&price=${calcCustomPrice}`}>
                  এই মূল্যে কাস্টমার অর্ডার দিন
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 5. Image Preview & Download Dialog */}
      <Dialog open={!!imageModalProduct} onOpenChange={(open) => !open && setImageModalProduct(null)}>
        <DialogContent className="max-w-lg rounded-2xl p-5 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              প্রোডাক্ট ফটো ও ডাউনলোড
            </DialogTitle>
          </DialogHeader>

          {imageModalProduct && (
            <div className="space-y-4">
              {/* Main Preview */}
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img 
                  src={selectedPreviewImage || imageModalProduct.image} 
                  alt={imageModalProduct.name} 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Thumbnails */}
              {imageModalProduct.images && imageModalProduct.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {imageModalProduct.images.map((imgUrl, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPreviewImage(imgUrl)}
                      className={`h-12 w-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        selectedPreviewImage === imgUrl ? "border-slate-900" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={imgUrl} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Clean Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Button
                  onClick={() => handleDownloadSingleImage(selectedPreviewImage || imageModalProduct.image, `${imageModalProduct.slug}.jpg`)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs h-9"
                >
                  এই ছবিটি ডাউনলোড করুন
                </Button>

                {imageModalProduct.images && imageModalProduct.images.length > 1 && (
                  <Button
                    onClick={() => handleDownloadAllImages(imageModalProduct)}
                    variant="outline"
                    className="border-slate-300 font-semibold rounded-lg text-xs h-9"
                  >
                    সব ছবি একসাথে ডাউনলোড ({imageModalProduct.images.length})
                  </Button>
                )}

                <Button
                  onClick={() => handleCopyCaption(imageModalProduct)}
                  variant="outline"
                  className="w-full sm:col-span-2 rounded-lg font-semibold text-xs h-9 border-slate-200"
                >
                  ফেসবুক ক্যাপশন কপি করুন
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </ResellerLayout>
  );
}
