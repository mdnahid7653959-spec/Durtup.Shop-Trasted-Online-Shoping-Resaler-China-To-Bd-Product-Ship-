import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { findGuideBySlug, BUYING_GUIDES } from "@/data/buyingGuidesData";
import { CATEGORIES_DATA } from "@/data/categoriesData";
import { Clock, Calendar, User, CheckCircle2, HelpCircle, ArrowRight, ShoppingBag, ShieldCheck } from "lucide-react";

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const guide = findGuideBySlug(slug || "");

  if (!guide) {
    return <Navigate to="/guides" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={guide.title}
        description={guide.metaDescription}
        url={`https://durtup.shop/guides/${guide.slug}`}
        type="article"
        article={{
          headline: guide.h1,
          description: guide.metaDescription,
          image: guide.image,
          datePublished: guide.publishDate,
          dateModified: guide.modifiedDate,
          authorName: guide.author,
          category: guide.categoryName
        }}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Buying Guides", url: "/guides" },
          { name: guide.categoryName, url: `/category/${guide.categorySlug}` },
          { name: guide.h1, url: `/guides/${guide.slug}` }
        ]}
        faqs={guide.faqs}
      />

      <Header />

      <main className="flex-1 pb-20 md:pb-12">
        <article className="container py-4 sm:py-8 max-w-4xl">
          
          <div className="mb-4">
            <Breadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: "Buying Guides", url: "/guides" },
                { name: guide.categoryName, url: `/category/${guide.categorySlug}` },
                { name: guide.h1, url: `/guides/${guide.slug}` }
              ]}
            />
          </div>

          {/* Article Header */}
          <header className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/category/${guide.categorySlug}`}
                className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {guide.categoryName}
              </Link>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {guide.readTime}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Updated {guide.modifiedDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
              {guide.h1}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed border-l-4 border-primary pl-4 py-1 italic bg-muted/30 rounded-r-lg">
              {guide.summary}
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Written by <strong className="text-foreground">{guide.author}</strong></span>
              <span>•</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified for Bangladesh Market</span>
            </div>
          </header>

          {/* Table of Contents / Quick Jump */}
          <div className="mb-8 bg-card border rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span>Table of Contents</span>
            </h2>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {guide.sections.map((sec, idx) => (
                <li key={idx}>
                  <a
                    href={`#section-${idx}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {sec.heading}
                  </a>
                </li>
              ))}
              {guide.faqs && guide.faqs.length > 0 && (
                <li>
                  <a href="#frequently-asked-questions" className="text-primary hover:underline font-medium">
                    Frequently Asked Questions (FAQ)
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Guide Sections */}
          <div className="space-y-8 text-foreground text-sm sm:text-base leading-relaxed">
            {guide.sections.map((section, idx) => (
              <section key={idx} id={`section-${idx}`} className="scroll-mt-20 space-y-3">
                <h2 className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                  {section.heading}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>

                {section.keyPoints && section.keyPoints.length > 0 && (
                  <div className="bg-muted/40 rounded-xl p-4 border border-border/80 my-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Key Recommendations:
                    </h3>
                    <ul className="space-y-2">
                      {section.keyPoints.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* Contextual E-Commerce CTA Banner */}
          <div className="my-10 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/25 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Looking for {guide.categoryName} in Bangladesh?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Order directly from Durtup.shop with 100% Cash on Delivery across all 64 districts.
              </p>
            </div>
            <Link
              to={`/category/${guide.categorySlug}`}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Shop {guide.categoryName}</span>
            </Link>
          </div>

          {/* FAQs Section */}
          {guide.faqs && guide.faqs.length > 0 && (
            <section id="frequently-asked-questions" className="mt-12 pt-8 border-t scroll-mt-20">
              <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <span>Frequently Asked Questions</span>
              </h2>

              <div className="space-y-3">
                {guide.faqs.map((faq, fIdx) => (
                  <div key={fIdx} className="bg-card border rounded-xl p-4">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      {faq.question}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Guides & Categories Internal Linking */}
          <footer className="mt-12 pt-8 border-t space-y-6">
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">
                More Buying Guides
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUYING_GUIDES.filter(g => g.slug !== guide.slug).slice(0, 4).map(other => (
                  <Link
                    key={other.slug}
                    to={`/guides/${other.slug}`}
                    className="p-3.5 rounded-xl bg-card border hover:border-primary/40 hover:bg-muted/40 transition-colors block"
                  >
                    <span className="text-xs text-primary font-semibold block">{other.categoryName}</span>
                    <span className="text-xs sm:text-sm font-bold text-foreground line-clamp-1 mt-0.5">{other.h1}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-foreground mb-3">
                Popular Product Categories in Bangladesh
              </h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES_DATA.slice(0, 8).map(c => (
                  <Link
                    key={c.id}
                    to={`/category/${c.slug}`}
                    className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary transition-colors border text-muted-foreground"
                  >
                    {c.name} Price in BD
                  </Link>
                ))}
              </div>
            </div>
          </footer>

        </article>
      </main>

      <Footer />
    </div>
  );
}
