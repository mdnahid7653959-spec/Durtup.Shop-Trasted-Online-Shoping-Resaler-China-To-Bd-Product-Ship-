import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { FileText, CheckCircle, AlertCircle, Scale } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Terms of Service - Durtup.shop"
        description="Read Durtup.shop terms and conditions for ordering, delivery, warranties, and platform usage in Bangladesh."
        url="https://durtup.shop/terms"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Terms of Service", url: "/terms" },
        ]}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white py-16">
          <div className="container text-center">
            <FileText className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="opacity-90">Last updated: January 1, 2026</p>
          </div>
        </div>

        <div className="container py-12 max-w-4xl">
          <div className="bg-card border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Durtup.shop, you accept and agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">2. Account Registration</h2>
            <p className="text-muted-foreground mb-4">To use certain features, you can create an account. You agree to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide accurate name, phone number, and Bangladesh shipping address</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Notify us immediately of any unauthorized account activity</li>
              <li>Accept responsibility for orders placed under your account</li>
            </ul>
          </div>

          <div className="bg-card border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">3. Purchases & Payment Methods</h2>
            <p className="text-muted-foreground mb-4">When ordering on Durtup.shop:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>All prices are displayed in Bangladeshi Taka (৳ BDT) including applicable taxes</li>
              <li>We offer 100% Cash on Delivery (COD) across all 64 districts in Bangladesh</li>
              <li>Digital payments via bKash, Nagad, and debit/credit cards are also supported where available</li>
              <li>All orders are subject to stock availability and customer verification</li>
            </ul>
          </div>

          <div className="bg-card border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">4. Shipping & Delivery</h2>
            <p className="text-muted-foreground">
              Delivery within Dhaka City takes 24-48 hours and outside Dhaka takes 2-3 business days across all 64 districts. 
              Customers must verify parcel contents in the presence of the courier rider upon delivery.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">5. Returns and Inspections</h2>
            <p className="text-muted-foreground">
              Customers are encouraged to inspect products at the time of delivery. Any damaged or incorrect item can be returned immediately to the delivery rider at no penalty.
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-warning" /> 6. Prohibited Activities</h2>
            <p className="text-muted-foreground mb-4">You may not:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Use the service for fraudulent or fake order placements</li>
              <li>Violate intellectual property rights or trade laws</li>
              <li>Attempt to gain unauthorized access to platform servers</li>
              <li>Harass delivery partners, merchants, or support staff</li>
            </ul>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /> 7. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by and construed in accordance with the laws of the People's Republic of Bangladesh. 
              Any disputes shall be resolved in the competent courts of Dhaka, Bangladesh.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
