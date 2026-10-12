import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Mail, Phone, MapPin, MessageCircle, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! Our support team will contact you shortly.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Contact Us - Durtup.shop Customer Support"
        description="Get in touch with Durtup.shop support team. We provide customer assistance for orders, returns, and delivery across Bangladesh."
        url="https://durtup.shop/contact"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Contact Us", url: "/contact" },
        ]}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary to-orange-500 text-white py-16">
          <div className="container text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-bold mb-3">Contact Durtup.shop</h1>
            <p className="text-base sm:text-lg opacity-90">We're here to assist you with your orders and inquiries</p>
          </div>
        </div>

        <div className="container py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="p-6 bg-card border rounded-xl shadow-sm">
                <Phone className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Phone & WhatsApp Support</h3>
                <p className="text-muted-foreground font-medium">+880 1622-530550</p>
                <p className="text-xs text-muted-foreground mt-1">Everyday 9:00 AM - 10:00 PM</p>
              </div>
              <div className="p-6 bg-card border rounded-xl shadow-sm">
                <Mail className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Email Support</h3>
                <p className="text-muted-foreground font-medium">support@durtup.shop</p>
                <p className="text-xs text-muted-foreground mt-1">Response within 2-4 hours</p>
              </div>
              <div className="p-6 bg-card border rounded-xl shadow-sm">
                <MapPin className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Office Address</h3>
                <p className="text-muted-foreground font-medium">Dhanmondi, Dhaka - 1209<br />Bangladesh</p>
              </div>
              <div className="p-6 bg-card border rounded-xl shadow-sm">
                <Clock className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Direct Support</h3>
                <p className="text-muted-foreground">Order & Delivery Assistance</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-card border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Name</label>
                      <Input 
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <Input 
                        type="email" 
                        value={form.email} 
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input 
                      value={form.subject} 
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea 
                      rows={5} 
                      value={form.message} 
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required 
                    />
                  </div>
                  <Button type="submit" size="lg">
                    <Send className="h-5 w-5 mr-2" /> Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
