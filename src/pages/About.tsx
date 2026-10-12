import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Building2, Users, Globe, Award, Target, Heart } from "lucide-react";

const stats = [
  { label: "Products", value: "100K+" },
  { label: "Happy Customers", value: "50K+" },
  { label: "Districts Covered", value: "64/64" },
  { label: "Verified Sellers", value: "500+" },
];

const values = [
  { icon: Target, title: "Customer First", desc: "Every decision we make starts with our customers in mind" },
  { icon: Award, title: "Quality Assured", desc: "We partner only with trusted suppliers and genuine brands" },
  { icon: Heart, title: "Fast Delivery & COD", desc: "Reliable Cash on Delivery across all 64 districts in Bangladesh" },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="About Us - Durtup.shop | Bangladesh's Modern E-Commerce Platform"
        description="Learn about Durtup.shop, Bangladesh's trusted e-commerce marketplace offering millions of quality products with fast home delivery and cash on delivery."
        url="https://durtup.shop/about"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "About Us", url: "/about" },
        ]}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary to-orange-500 text-white py-16 sm:py-20">
          <div className="container text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4">About Durtup.shop</h1>
            <p className="text-base sm:text-xl opacity-90 max-w-2xl mx-auto">Connecting millions of shoppers with top quality products across Bangladesh</p>
          </div>
        </div>

        {/* Stats */}
        <div className="container -mt-10 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card border rounded-xl p-6 text-center shadow-lg">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="container py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Durtup.shop started with a simple mission: make online shopping fast, reliable, and accessible for everyone in Bangladesh.
              </p>
              <p className="text-muted-foreground mb-4">
                Today, we provide shoppers across all 64 districts in Bangladesh with genuine tech gadgets, smart watches, fashion, and home lifestyle products with 100% Cash on Delivery and dedicated customer support.
              </p>
              <p className="text-muted-foreground">
                Our platform offers cutting-edge AI search, instant 3-second checkout, and doorstep fulfillment with trusted courier partners.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-orange-500/20 rounded-2xl p-8 flex items-center justify-center">
              <Building2 className="h-40 w-40 text-primary/50" />
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-muted py-16">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value) => (
                <div key={value.title} className="bg-card border rounded-xl p-6 text-center">
                  <value.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nationwide Reach */}
        <div className="container py-16 text-center">
          <Globe className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Nationwide 64-District Reach</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From Dhaka, Chittagong, and Sylhet to remote upazilas, Durtup.shop connects customers with verified merchants and genuine products with 100% Cash on Delivery and reliable doorstep logistics.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
