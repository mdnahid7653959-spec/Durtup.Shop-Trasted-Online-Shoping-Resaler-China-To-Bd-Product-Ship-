import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Truck, Clock, MapPin, Package, ShieldCheck, Zap } from "lucide-react";

const shippingMethods = [
  { icon: Zap, name: "Inside Dhaka Express", time: "24-48 Hours", price: "৳60", color: "text-green-500" },
  { icon: Truck, name: "All Bangladesh Districts", time: "2-3 Business Days", price: "৳60", color: "text-blue-500" },
  { icon: ShieldCheck, name: "Cash on Delivery", time: "At Your Doorstep", price: "100% Guaranteed", color: "text-orange-500" },
];

const zones = [
  { region: "Dhaka City (ঢাকা মেট্রো)", standard: "24-48 Hours", express: "Next Day" },
  { region: "Dhaka Suburbs (গাজীপুর, নারায়ণগঞ্জ, সাভার)", standard: "1-2 Business Days", express: "24-48 Hours" },
  { region: "Chittagong Division (চট্টগ্রাম বিভাগ)", standard: "2-3 Business Days", express: "48 Hours" },
  { region: "Sylhet Division (সিলেট বিভাগ)", standard: "2-3 Business Days", express: "48 Hours" },
  { region: "Rajshahi & Rangpur (রাজশাহী ও রংপুর বিভাগ)", standard: "2-3 Business Days", express: "48 Hours" },
  { region: "Khulna & Barisal (খুলনা ও বরিশাল বিভাগ)", standard: "2-3 Business Days", express: "48 Hours" },
  { region: "Mymensingh Division (ময়মনসিংহ বিভাগ)", standard: "2-3 Business Days", express: "48 Hours" },
];

export default function Shipping() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Shipping & Delivery Policy - Durtup.shop Bangladesh"
        description="Learn about Durtup.shop delivery timeline, shipping rates across Dhaka and all 64 districts in Bangladesh, and Cash on Delivery details."
        url="https://durtup.shop/shipping"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Shipping Information", url: "/shipping" },
        ]}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary to-orange-500 text-white py-16">
          <div className="container text-center">
            <Truck className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-bold mb-3">Shipping & Delivery Information</h1>
            <p className="text-base sm:text-lg opacity-90">Fast, reliable doorstep delivery across all 64 districts in Bangladesh</p>
          </div>
        </div>

        <div className="container py-12">
          <h2 className="text-2xl font-bold mb-6">Delivery Options</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {shippingMethods.map((method) => (
              <div key={method.name} className="p-6 bg-card border rounded-xl shadow-sm">
                <method.icon className={`h-12 w-12 ${method.color} mb-4`} />
                <h3 className="font-semibold text-lg mb-2">{method.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" /> {method.time}
                </div>
                <p className="text-primary font-bold text-sm">{method.price}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-6">Delivery Times by Region (৬৪ জেলায় ডেলিভারি সময়)</h2>
          <div className="bg-card border rounded-xl overflow-hidden mb-12">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Region</th>
                  <th className="px-6 py-4 text-left font-semibold">Standard Delivery</th>
                  <th className="px-6 py-4 text-left font-semibold">Express Delivery</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.region} className="border-t">
                    <td className="px-6 py-4 flex items-center gap-2 font-medium text-foreground"><MapPin className="h-4 w-4 text-primary shrink-0" /> {zone.region}</td>
                    <td className="px-6 py-4 text-muted-foreground">{zone.standard}</td>
                    <td className="px-6 py-4 text-muted-foreground">{zone.express}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Delivery & Inspection Guarantee
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every parcel shipped by Durtup.shop can be verified upon arrival. Check your items with the courier rider before making Cash on Delivery payment for complete peace of mind.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
