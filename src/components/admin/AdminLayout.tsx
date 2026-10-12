import { ReactNode, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Tag, 
  Settings,
  LogOut,
  ChevronRight,
  Layers,
  Percent,
  Star,
  Menu,
  Home,
  Warehouse,
  Megaphone,
  Gift,
  Truck,
  BarChart3,
  Shield,
  FileText,
  Store,
  CreditCard,
  MessageSquare,
  Bell,
  Download,
  Palette,
  RotateCcw,
  Wallet,
  Banknote,
  Link2,
  Search,
  Bot,
  DownloadCloud,
  Share2,
  TrendingUp,
  DollarSign,
  Activity,
  Globe,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAdminPWAInstall } from "@/hooks/useAdminPWAInstall";
import { AdminNotificationBell } from "./AdminNotificationBell";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export interface NavSection {
  group: string;
  items: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
    badge?: string;
    badgeColor?: string;
  }[];
}

export const navSections: NavSection[] = [
  {
    group: "Business Control",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
      { icon: Sparkles, label: "AI Admin Assistant", href: "/admin/ai-admin", badge: "AI", badgeColor: "bg-purple-500/20 text-purple-700 dark:text-purple-300" },
      { icon: Activity, label: "Activity / Audit Logs", href: "/admin/audit-logs" },
      { icon: Bell, label: "Notification Center", href: "/admin/notifications" },
    ],
  },
  {
    group: "Catalog & Stock",
    items: [
      { icon: Package, label: "Products", href: "/admin/products" },
      { icon: Warehouse, label: "Inventory", href: "/admin/inventory" },
      { icon: DollarSign, label: "Pricing Rules", href: "/admin/pricing", badge: "New", badgeColor: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" },
      { icon: Layers, label: "Categories", href: "/admin/categories" },
      { icon: Tag, label: "Brands", href: "/admin/brands" },
      { icon: Bot, label: "AI Product Search", href: "/admin/ai-search", badge: "Smart", badgeColor: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
    ],
  },
  {
    group: "Orders & Fulfillment",
    items: [
      { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
      { icon: RotateCcw, label: "Returns & Refunds", href: "/admin/returns" },
      { icon: Truck, label: "Shipping & Courier", href: "/admin/shipping" },
      { icon: Warehouse, label: "Warehouses", href: "/admin/warehouses" },
      { icon: Truck, label: "Consignments", href: "/admin/consignments" },
    ],
  },
  {
    group: "Customers & Partners",
    items: [
      { icon: Users, label: "Customers", href: "/admin/users" },
      { icon: Link2, label: "Suppliers Hub", href: "/admin/suppliers" },
      { icon: Store, label: "Sellers", href: "/admin/sellers" },
      { icon: MessageSquare, label: "Reviews & Ratings", href: "/admin/reviews" },
      { icon: MessageSquare, label: "Seller Support", href: "/admin/seller-support" },
    ],
  },
  {
    group: "Growth & Marketing",
    items: [
      { icon: Megaphone, label: "Marketing", href: "/admin/marketing" },
      { icon: Percent, label: "Coupons & Discounts", href: "/admin/coupons" },
      { icon: TrendingUp, label: "Ads Manager", href: "/admin/ads", badge: "Pro", badgeColor: "bg-amber-500/20 text-amber-700 dark:text-amber-300" },
      { icon: Search, label: "Search Management", href: "/admin/search-management" },
      { icon: Globe, label: "SEO Management", href: "/admin/seo" },
      { icon: Gift, label: "Loyalty & Points", href: "/admin/loyalty" },
    ],
  },
  {
    group: "Finance & Accounts",
    items: [
      { icon: Banknote, label: "Payments & Finance", href: "/admin/finance" },
      { icon: CreditCard, label: "Payment Gateways", href: "/admin/payments" },
      { icon: Wallet, label: "Wallets", href: "/admin/wallet" },
      { icon: Share2, label: "Referrals & Rewards", href: "/admin/referrals" },
      { icon: Percent, label: "Commissions", href: "/admin/commissions" },
      { icon: BarChart3, label: "Analytics & Reports", href: "/admin/reports" },
    ],
  },
  {
    group: "Storefront & System",
    items: [
      { icon: FileText, label: "CMS & Website Control", href: "/admin/cms" },
      { icon: Palette, label: "Visual Editor", href: "/admin/visual-editor" },
      { icon: Users, label: "Staff & RBAC", href: "/admin/staff" },
      { icon: Shield, label: "Security & Access", href: "/admin/security" },
      { icon: Settings, label: "System Settings", href: "/admin/settings" },
    ],
  },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdminAuth();
  const { canInstall, isInstalled, install } = useAdminPWAInstall();
  const [filterQuery, setFilterQuery] = useState("");

  const handleSignOut = () => {
    logout();
    navigate("/admin/login");
  };

  const filteredSections = useMemo(() => {
    if (!filterQuery.trim()) return navSections;
    const q = filterQuery.toLowerCase();
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            section.group.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [filterQuery]);

  return (
    <>
      <div className="p-4 border-b shrink-0 bg-card">
        <Link to="/" className="flex items-center gap-2.5" onClick={onItemClick}>
          <img 
            src="/durtup-logo.png" 
            alt="Durtup.shop" 
            className="h-8 w-auto object-contain"
          />
          <div>
            <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              Durtup OS
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                PRO
              </span>
            </span>
            <p className="text-[11px] text-muted-foreground leading-none">Enterprise Control Center</p>
          </div>
        </Link>

        {/* Quick Nav Search */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search 24 modules..."
            className="h-8 text-xs pl-8 pr-2 bg-muted/50 border-muted-foreground/20 focus-visible:ring-1"
          />
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {filteredSections.map((section) => (
          <div key={section.group}>
            <p className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
              {section.group}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== "/admin" && location.pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onItemClick}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className={cn(
                          "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                          isActive ? "text-primary-foreground" : "text-muted-foreground"
                        )} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                          item.badgeColor || (isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary")
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t mt-auto shrink-0 bg-card/60 backdrop-blur-xs">
        <div className="flex items-center gap-2.5 mb-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 border border-primary/20">
            <span className="text-primary font-bold text-xs">
              {admin?.displayName?.charAt(0) || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">
              {admin?.displayName || "Super Admin"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {admin?.username || "admin@durtup.shop"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 flex-1 text-xs" onClick={handleSignOut}>
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign Out
          </Button>
          {canInstall && !isInstalled && (
            <Button 
              variant="default" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={install}
              title="Install Desktop App"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r flex-col fixed h-full z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b z-40 flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2 min-w-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-foreground truncate text-sm sm:text-base">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <AdminNotificationBell />
          <Link to="/" className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1 py-1 px-1.5 rounded-md hover:bg-muted">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Store</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 h-screen overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-14 border-b bg-card items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground font-medium">
              Durtup OS
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-foreground font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/admin/ai-admin"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 font-medium transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              AI Assistant
            </Link>
            <AdminNotificationBell />
            <Link 
              to="/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium bg-primary/5 px-2.5 py-1 rounded-md border border-primary/20"
            >
              <Home className="h-3.5 w-3.5" />
              View Storefront
            </Link>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto mt-14 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
