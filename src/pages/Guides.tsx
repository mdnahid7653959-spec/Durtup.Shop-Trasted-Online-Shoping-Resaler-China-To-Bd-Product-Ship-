import React from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { BUYING_GUIDES } from "@/data/buyingGuidesData";
import { BookOpen, ArrowRight, Clock, ShieldCheck, ShoppingBag } from "lucide-react";

export default function Guides() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Buying Guides & Shopping Tips in Bangladesh | Durtup.shop"
        description="Read expert gadgets, smart watches, earbuds, and online shopping buying guides tailored for Bangladesh. Tips on choosing best prices, features, and safe COD shopping."
        url="https://durtup.shop/guides"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Buying Guides", url: "/guides" }
        ]}
        itemList={BUYING_GUIDES.map(g => ({
          name: g.h1,
          url: `/guides/${g.slug}`,
          image: g.image
        }))}
      />

      <Header />

      <main className="flex-1 pb-20 md:pb-12">
        <div className="container py-4 sm:py-8 max-w-6xl">
          
          <div className="mb-4">
            <Breadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: "Buying Guides & Tips", url: "/guides" }
              ]}
            />
          </div>

          {/* Hero Banner */}
          <div className="mb-8 bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/20 rounded-3xl p-6 sm:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 text-xs font-bold mb-3">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Expert E-Commerce & Gadget Guides</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                Buying Guides & Tech Shopping Tips in Bangladesh
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
                Make smart shopping decisions. Explore comprehensive buying advice, product comparisons, battery tips, and safe Cash on Delivery shopping guidelines from Durtup.shop.
              </p>
            </div>
          </div>

          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BUYING_GUIDES.map((guide) => (
              <article
                key={guide.slug}
                className="group flex flex-col bg-card rounded-2xl border border-border/80 overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all duration-300"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-secondary text-primary">
                      {guide.categoryName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {guide.readTime}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                    <Link to={`/guides/${guide.slug}`} className="hover:underline">
                      {guide.h1}
                    </Link>
                  </h2>

                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4 flex-1">
                    {guide.summary}
                  </p>

                  <div className="pt-3 border-t flex items-center justify-between text-xs font-bold text-primary">
                    <Link
                      to={`/guides/${guide.slug}`}
                      className="inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all"
                    >
                      <span>Read Guide</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to={`/category/${guide.categorySlug}`}
                      className="text-muted-foreground hover:text-foreground font-normal text-[11px]"
                    >
                      Shop Category →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Sitewide Internal Linking Callout */}
          <section className="mt-12 bg-secondary/50 rounded-2xl p-6 sm:p-8 border text-center">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Ready to Explore Authentic Gadgets with 100% Cash on Delivery?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto mt-2 mb-6">
              Shop over 3,000+ top gadgets, smartwatches, earbuds, men's & women's fashion with rider inspection before payment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Browse All Products</span>
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card border font-bold text-sm hover:bg-muted transition-colors"
              >
                <span>View All Categories</span>
              </Link>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
