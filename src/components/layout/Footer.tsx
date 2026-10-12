import { Link } from "react-router-dom";
import { 
  Facebook, Instagram,
  CreditCard, Shield, Truck, Headphones,
  LucideIcon
} from "lucide-react";
import { useSiteConfig } from "@/hooks/useSiteConfig";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className || "h-4 w-4"} 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.5 6.3 6.3 0 0 0 1.86-4.49V8.78a8.21 8.21 0 0 0 4.91 1.62v-3.71z"/>
    </svg>
  );
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Truck, 
  shield: Shield, 
  headphones: Headphones, 
  "credit-card": CreditCard,
  facebook: Facebook, 
  instagram: Instagram, 
  tiktok: TikTokIcon,
};

interface FooterLink { name: string; href: string; }
interface FooterColumn { title: string; links: FooterLink[]; }
interface TrustBadge { icon: string; title: string; desc: string; }
interface SocialLink { platform: string; url: string; }

interface FooterConfig {
  columns: FooterColumn[];
  trust_badges: TrustBadge[];
  social_links: SocialLink[];
  copyright: string;
  brand_description: string;
  logo_url: string;
  payment_methods: string[];
}

const defaultFooterConfig: FooterConfig = {
  columns: [
    { title: "Customer Service", links: [
      { name: "Help Center", href: "/help" }, { name: "Returns", href: "/returns" },
      { name: "Shipping", href: "/shipping" }, { name: "Track Order", href: "/track" },
      { name: "Contact", href: "/contact" },
    ]},
    { title: "About Us", links: [
      { name: "About", href: "/about" }, { name: "Buying Guides", href: "/guides" },
      { name: "Careers", href: "/careers" }, { name: "Press", href: "/press" },
      { name: "Affiliate", href: "/affiliate" }, { name: "Reseller Hub", href: "/reseller" },
    ]},
    { title: "Policies", links: [
      { name: "Privacy", href: "/privacy" }, { name: "Terms", href: "/terms" },
      { name: "Cookies", href: "/cookies" }, { name: "IP Rights", href: "/ip" },
    ]},
  ],
  trust_badges: [
    { icon: "truck", title: "Fast Delivery", desc: "All 64 BD Districts" },
    { icon: "shield", title: "100% COD", desc: "Cash on Delivery" },
    { icon: "headphones", title: "Live Support", desc: "+880 1622-530550" },
    { icon: "credit-card", title: "Rider Inspection", desc: "Check before paying" },
  ],
  social_links: [
    { platform: "facebook", url: "https://www.facebook.com/profile.php?id=61582125938251" },
    { platform: "instagram", url: "https://www.instagram.com/durtup.shop/" },
    { platform: "tiktok", url: "https://www.tiktok.com/@durtup.shop?is_from_webapp=1&sender_device=pc" },
  ],
  copyright: "© 2026 Durtup.shop. All rights reserved. Dhaka, Bangladesh.",
  brand_description: "Durtup.shop is Bangladesh's trusted online marketplace offering gadgets, smart watches, earbuds, fashion, and home essentials with 100% Cash on Delivery across all 64 districts.",
  logo_url: "/durtup-logo.svg",
  payment_methods: ["Cash on Delivery", "bKash", "Nagad", "Visa", "Mastercard"],
};

export function Footer() {
  const { config } = useSiteConfig<FooterConfig>("footer", defaultFooterConfig);

  const columns = config.columns?.length ? config.columns : defaultFooterConfig.columns;
  const trustBadges = config.trust_badges?.length ? config.trust_badges : defaultFooterConfig.trust_badges;
  const socialLinks = (config.social_links?.length && config.social_links.some(s => s.url && s.url !== "#" && (s.platform === "facebook" || s.platform === "instagram" || s.platform === "tiktok")))
    ? config.social_links
    : defaultFooterConfig.social_links;
  const copyright = config.copyright || defaultFooterConfig.copyright;
  const brandDesc = config.brand_description || defaultFooterConfig.brand_description;
  const logoUrl = config.logo_url || defaultFooterConfig.logo_url;
  const paymentMethods = config.payment_methods?.length ? config.payment_methods : defaultFooterConfig.payment_methods;

  return (
    <footer className="bg-secondary border-t hidden md:block">
      {/* Features bar */}
      <div className="border-b overflow-x-auto scrollbar-hide">
        <div className="container py-4 sm:py-6">
          <div className="flex sm:grid sm:grid-cols-4 gap-4 sm:gap-6 min-w-max sm:min-w-0">
            {trustBadges.map((badge) => {
              const Icon = iconMap[badge.icon] || Shield;
              return (
                <div key={badge.title} className="flex items-center gap-2.5 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs sm:text-sm">{badge.title}</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{badge.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img 
                src={(logoUrl && !logoUrl.endsWith(".png")) ? logoUrl : "/durtup-logo.svg"} 
                alt="Durtup.shop" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/durtup-logo.svg";
                }}
              />
            </Link>
            <p className="text-muted-foreground mb-4 text-xs leading-relaxed max-w-xs">{brandDesc}</p>
            <div className="flex items-center gap-2.5">
              {socialLinks.map((social, idx) => {
                const Icon = iconMap[social.platform.toLowerCase()] || Facebook;
                return (
                  <a 
                    key={idx} 
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={`Follow us on ${social.platform}`}
                    className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 touch-manipulation hover:scale-105 shadow-sm"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-bold text-foreground mb-3 text-xs sm:text-sm">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-muted-foreground hover:text-primary transition-colors text-[11px] sm:text-xs touch-manipulation compact-link">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="container py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">{copyright}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-xs text-muted-foreground mr-1">We accept:</span>
            {paymentMethods.map((card) => (
              <div key={card} className="h-6 px-2 rounded bg-card border flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                {card}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
