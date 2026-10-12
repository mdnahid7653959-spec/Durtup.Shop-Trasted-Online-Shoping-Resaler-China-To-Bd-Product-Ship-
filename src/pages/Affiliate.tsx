import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DollarSign, Users, TrendingUp, Gift, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";

const benefits = [
  { icon: DollarSign, title: "Earn High Commissions", desc: "Up to 10% commission on every verified sale" },
  { icon: Users, title: "Long Cookie Window", desc: "30-day tracking window for credited customer referrals" },
  { icon: TrendingUp, title: "Live Payout Tracking", desc: "Track clicks, orders, and weekly bKash/Nagad/Bank payouts" },
  { icon: Gift, title: "Top Earner Bonuses", desc: "Extra monthly bonuses for high-performing Bangladesh affiliates" },
];

const steps = [
  "Sign up for a free affiliate partner account",
  "Get your unique Durtup product referral links",
  "Share gadgets, watches, and fashion with your audience",
  "Earn automated weekly commission payouts",
];

export default function Affiliate() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Affiliate & Reseller Partner Program - Durtup.shop"
        description="Join the Durtup.shop Affiliate & Reseller program in Bangladesh. Earn high commissions promoting trending gadgets, smart watches, and fashion."
        url="https://durtup.shop/affiliate"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Affiliate Program", url: "/affiliate" },
        ]}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-16 sm:py-20">
          <div className="container text-center">
            <DollarSign className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3">Durtup.shop Affiliate Program</h1>
            <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto mb-8">
              Earn generous commissions promoting trending e-commerce products across Bangladesh
            </p>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 font-bold" asChild>
              <Link to="/register">Join Now - It's Free</Link>
            </Button>
          </div>
        </div>

        {/* Benefits */}
        <div className="container py-12">
          <h2 className="text-2xl font-bold text-center mb-8">Why Join Our Program?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="p-6 bg-card border rounded-xl text-center">
                <b.icon className="h-10 w-10 text-success mx-auto mb-4" />
                <h3 className="font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-muted py-12">
          <div className="container">
            <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
            <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
              {steps.map((step, i) => (
                <div key={i} className="flex-1 flex items-center gap-3 p-4 bg-card border rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </div>
                  <span className="font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sign up */}
        <div className="container py-12">
          <div className="max-w-xl mx-auto bg-card border rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-muted-foreground mb-6">Enter your email to get started</p>
            <div className="flex gap-2">
              <Input placeholder="Enter your email" type="email" />
              <Button>Join Now</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">By joining, you agree to our affiliate terms and conditions</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
