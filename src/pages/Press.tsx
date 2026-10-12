import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Newspaper, Calendar, Truck, Sparkles, ShieldCheck, Mail, Phone } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const pressReleases = [
  {
    id: 1,
    date: "Jan 15, 2026",
    title: "Durtup.shop Expands Ultra-Fast 64-District Cash On Delivery Across Bangladesh",
    excerpt: "Durtup.shop completes major logistics integration to offer guaranteed doorstep Cash on Delivery (COD) within 24-48 hours in Dhaka and 2-3 business days across all 64 districts in Bangladesh.",
    icon: Truck,
  },
  {
    id: 2,
    date: "Dec 20, 2025",
    title: "Durtup.shop Introduces Next-Gen AI Shopping Assistant for Bangladeshi Consumers",
    excerpt: "New AI search and natural language conversational discovery capabilities allow shoppers to find authentic gadgets, smart watches, and fashion items instantly.",
    icon: Sparkles,
  },
  {
    id: 3,
    date: "Nov 10, 2025",
    title: "Durtup.shop Launches 100% Rider-Verified Parcel Inspection Policy",
    excerpt: "Ensuring zero-risk online shopping, Durtup.shop allows customers nationwide to inspect parcels in front of delivery riders before final payment.",
    icon: ShieldCheck,
  },
];

export default function Press() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Press & Newsroom - Durtup.shop Bangladesh"
        description="Official press releases, media resources, and company announcements from Durtup.shop — Bangladesh's trusted e-commerce shopping platform."
        url="https://durtup.shop/press"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Press Center", url: "/press" },
        ]}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary to-orange-500 text-white py-16 sm:py-20">
          <div className="container text-center">
            <Newspaper className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3">Durtup.shop Press Center</h1>
            <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto">
              Official news, company updates, and media resources from Durtup.shop
            </p>
          </div>
        </div>

        <div className="container py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Latest Announcements & Press Releases</h2>
              <div className="space-y-4">
                {pressReleases.map((pr) => {
                  const Icon = pr.icon;
                  return (
                    <article key={pr.id} className="p-6 bg-card border rounded-2xl shadow-xs hover:border-primary transition-all">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                        <Calendar className="h-3.5 w-3.5" /> {pr.date}
                      </div>
                      <h3 className="font-bold text-lg sm:text-xl mb-2 text-foreground">{pr.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{pr.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Icon className="h-4 w-4" /> Verified Official Release
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Media & PR Inquiries</h2>
              <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-xs">
                <p className="text-muted-foreground text-sm">
                  For press, partnership, or interview inquiries regarding Durtup.shop, please contact our media team:
                </p>
                <div className="p-3 bg-muted rounded-xl flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Press Email</p>
                    <p className="font-bold text-sm text-foreground">press@durtup.shop</p>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-xl flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Media Hotline</p>
                    <p className="font-bold text-sm text-foreground">+880 1622-530550</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-xs font-medium text-foreground">Dhanmondi, Dhaka - 1209, Bangladesh</p>
                </div>
              </div>

              <div className="bg-muted rounded-2xl p-6 mt-6">
                <h3 className="font-bold mb-2">About Durtup.shop</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Durtup.shop is a premier online marketplace in Bangladesh providing consumers with high quality tech gadgets, smart wearables, lifestyle essentials, and fashion with 100% Cash on Delivery across all 64 districts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
