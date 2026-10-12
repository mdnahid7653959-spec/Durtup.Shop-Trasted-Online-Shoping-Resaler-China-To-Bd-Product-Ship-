import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Store, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";

export default function Seller() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Become a Seller - Durtup.shop | Start Selling in Bangladesh"
        description="Sell your products on Durtup.shop, Bangladesh's modern e-commerce marketplace. Reach millions of customers with low commission, fast payouts, and seller support."
        url="https://durtup.shop/seller"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Seller Hub", url: "/seller" },
        ]}
      />
      <Header />
      <main className="flex-1 py-12 px-4 max-w-5xl mx-auto">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Sell on Durtup.shop
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Grow your business across all 64 districts in Bangladesh with our modern verified seller platform.
          </p>
          <div className="pt-4 flex justify-center gap-4">
            <Link
              to="/seller/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-all shadow-md"
            >
              Register as Seller <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/seller/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border hover:bg-muted font-semibold transition-all"
            >
              Seller Dashboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
