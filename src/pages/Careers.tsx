import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Briefcase, MapPin, Clock, ChevronRight, Users, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

const jobs = [
  { id: 1, title: "Full Stack Engineer (React/Node)", dept: "Engineering", location: "Dhaka / Remote", type: "Full-time" },
  { id: 2, title: "E-Commerce Category Growth Manager", dept: "Operations", location: "Dhaka, Bangladesh", type: "Full-time" },
  { id: 3, title: "Digital Marketing & Performance Specialist", dept: "Marketing", location: "Dhaka, Bangladesh", type: "Full-time" },
  { id: 4, title: "Customer Success & Merchant Support Lead", dept: "Support", location: "Dhaka, Bangladesh", type: "Full-time" },
  { id: 5, title: "Logistics & Delivery Operations Coordinator", dept: "Fulfillment", location: "Dhaka, Bangladesh", type: "Full-time" },
];

const perks = [
  { icon: Users, title: "Impactful Work", desc: "Build cutting-edge e-commerce infrastructure for Bangladesh" },
  { icon: Zap, title: "Rapid Growth", desc: "Fast-track career advancement and competitive compensation" },
  { icon: Heart, title: "Collaborative Culture", desc: "Supportive team environment with flexible hybrid options" },
];

export default function Careers() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="Careers & Job Openings - Durtup.shop"
        description="Explore exciting career opportunities at Durtup.shop. Join our technology, e-commerce, and logistics teams in Dhaka, Bangladesh."
        url="https://durtup.shop/careers"
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Careers", url: "/careers" },
        ]}
      />
      <Header />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-primary to-orange-500 text-white py-16 sm:py-20">
          <div className="container text-center">
            <Briefcase className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3">Careers at Durtup.shop</h1>
            <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto">
              Help us shape the future of modern e-commerce and fast delivery across Bangladesh
            </p>
          </div>
        </div>

        {/* Perks */}
        <div className="container py-12">
          <div className="grid md:grid-cols-3 gap-6">
            {perks.map((perk) => (
              <div key={perk.title} className="p-6 bg-card border rounded-xl text-center">
                <perk.icon className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">{perk.title}</h3>
                <p className="text-sm text-muted-foreground">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="container py-12">
          <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="p-6 bg-card border rounded-xl flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{job.dept}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {job.type}</span>
                  </div>
                </div>
                <Button>
                  Apply Now <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted py-12">
          <div className="container text-center">
            <h2 className="text-2xl font-bold mb-4">Don't see a perfect fit?</h2>
            <p className="text-muted-foreground mb-6">Send us your resume and we'll keep you in mind for future opportunities</p>
            <Button variant="outline" size="lg">Submit General Application</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
