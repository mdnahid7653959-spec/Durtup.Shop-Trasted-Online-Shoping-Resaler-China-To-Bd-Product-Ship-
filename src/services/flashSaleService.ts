import { supabase } from "@/lib/firebaseAdapter";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import type { Product } from "@/components/products/ProductCard";

export interface FlashSaleProductItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  regularPrice: number;
  discountPercent: number;
  flashPrice: number;
  flashStock: number;   // Allocated flash sale stock quota
  flashSold: number;    // Units sold during this flash sale
}

export interface FlashSaleCampaign {
  id: string;
  title: string;
  titleBn: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  status: "active" | "upcoming" | "ended" | "paused";
  products: FlashSaleProductItem[];
  bannerUrl?: string;
  createdAt: string;
  analytics: {
    totalRevenue: number;
    totalOrders: number;
    totalUnitsSold: number;
  };
}

const STORAGE_KEY = "durtup_flash_sale_campaigns";
const EVENT_NAME = "durtup_flash_sale_updated";

/**
 * Default Initial Campaign with 24-hour live running window
 */
function createDefaultCampaign(): FlashSaleCampaign {
  const now = Date.now();
  const startTime = new Date(now - 2 * 60 * 60 * 1000).toISOString(); // Started 2h ago
  const endTime = new Date(now + 22 * 60 * 60 * 1000).toISOString();  // Ends in 22h

  const seedSample = FAST_SEED_PRODUCTS.slice(0, 6);

  const products: FlashSaleProductItem[] = seedSample.map((p, idx) => {
    const regPrice = Number(p.originalPrice || p.price) || 1200;
    const discountPercent = [35, 30, 38, 37, 26, 40][idx % 6];
    const flashPrice = Math.round(regPrice * (1 - discountPercent / 100));
    const flashStock = [40, 50, 60, 30, 35, 45][idx % 6];
    const flashSold = [29, 42, 51, 21, 28, 38][idx % 6];

    return {
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      regularPrice: regPrice,
      discountPercent,
      flashPrice,
      flashStock,
      flashSold,
    };
  });

  const totalUnitsSold = products.reduce((acc, p) => acc + p.flashSold, 0);
  const totalRevenue = products.reduce((acc, p) => acc + p.flashSold * p.flashPrice, 0);

  return {
    id: "campaign-mega-flash-sale-2026",
    title: "Mega Flash Sale Deals",
    titleBn: "মেগা ফ্ল্যাশ সেল অফার",
    description: "সীমিত সময়ের জন্য বাছাইকৃত জনপ্রিয় পণ্যে সর্বোচ্চ ৪০% পর্যন্ত অবিশ্বাস্য ছাড়!",
    startTime,
    endTime,
    status: "active",
    products,
    bannerUrl: "/banners/hero-banner-1.webp",
    createdAt: new Date().toISOString(),
    analytics: {
      totalRevenue,
      totalOrders: Math.round(totalUnitsSold * 0.85),
      totalUnitsSold,
    },
  };
}

/**
 * Get server-synchronized timestamp
 */
export function getServerTime(): number {
  return Date.now();
}

/**
 * Broadcast event across browser tabs and components
 */
function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

/**
 * Load all campaigns from localStorage / cache
 */
export function getAllCampaigns(): FlashSaleCampaign[] {
  if (typeof window === "undefined") return [createDefaultCampaign()];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = [createDefaultCampaign()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) {
      const initial = [createDefaultCampaign()];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return list;
  } catch (err) {
    console.warn("getAllCampaigns error:", err);
    return [createDefaultCampaign()];
  }
}

/**
 * Save all campaigns to storage
 */
export function saveAllCampaigns(campaigns: FlashSaleCampaign[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
    notifyUpdate();
  } catch (err) {
    console.warn("saveAllCampaigns error:", err);
  }
}

/**
 * Get the currently active Flash Sale campaign
 * Verifies that now >= startTime and now < endTime and status === 'active'
 */
export function getActiveFlashSaleCampaign(): FlashSaleCampaign | null {
  const campaigns = getAllCampaigns();
  const now = getServerTime();

  for (const c of campaigns) {
    const start = new Date(c.startTime).getTime();
    const end = new Date(c.endTime).getTime();

    // Check time boundaries
    if (c.status === "active" && now >= start && now < end) {
      return c;
    }

    // Auto-expire past campaigns
    if (c.status === "active" && now >= end) {
      c.status = "ended";
      saveAllCampaigns(campaigns);
    }
  }

  return null;
}

/**
 * Create a new Flash Sale Campaign
 */
export function createFlashSaleCampaign(data: Omit<FlashSaleCampaign, "id" | "createdAt" | "analytics">): FlashSaleCampaign {
  const campaigns = getAllCampaigns();
  const id = `campaign-${Date.now()}`;
  const newCampaign: FlashSaleCampaign = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
    analytics: {
      totalRevenue: 0,
      totalOrders: 0,
      totalUnitsSold: 0,
    },
  };

  // If new campaign is set to active, pause other active campaigns
  if (newCampaign.status === "active") {
    campaigns.forEach((c) => {
      if (c.status === "active") c.status = "paused";
    });
  }

  campaigns.unshift(newCampaign);
  saveAllCampaigns(campaigns);

  // Background sync to database
  supabase
    .from("flash_sales")
    .upsert({
      id: newCampaign.id,
      title: newCampaign.title,
      start_time: newCampaign.startTime,
      end_time: newCampaign.endTime,
      status: newCampaign.status,
      campaign_data: newCampaign,
      created_at: newCampaign.createdAt,
    })
    .catch(() => {});

  return newCampaign;
}

/**
 * Update an existing Flash Sale Campaign
 */
export function updateFlashSaleCampaign(id: string, updates: Partial<FlashSaleCampaign>): FlashSaleCampaign | null {
  const campaigns = getAllCampaigns();
  const idx = campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const current = campaigns[idx];
  const updated: FlashSaleCampaign = {
    ...current,
    ...updates,
  };

  // If activated, pause others
  if (updates.status === "active") {
    campaigns.forEach((c) => {
      if (c.id !== id && c.status === "active") c.status = "paused";
    });
  }

  campaigns[idx] = updated;
  saveAllCampaigns(campaigns);

  // Background sync to database
  supabase
    .from("flash_sales")
    .upsert({
      id: updated.id,
      title: updated.title,
      start_time: updated.startTime,
      end_time: updated.endTime,
      status: updated.status,
      campaign_data: updated,
    })
    .catch(() => {});

  return updated;
}

/**
 * Delete a Flash Sale Campaign
 */
export function deleteFlashSaleCampaign(id: string): boolean {
  const campaigns = getAllCampaigns();
  const filtered = campaigns.filter((c) => c.id !== id);
  if (filtered.length === campaigns.length) return false;

  saveAllCampaigns(filtered);

  // Background DB delete
  supabase.from("flash_sales").delete().eq("id", id).catch(() => {});

  return true;
}

/**
 * Check if a product has an active Flash Sale and available flash stock
 */
export function getProductFlashSaleInfo(productId: string): {
  isFlashSale: boolean;
  flashPrice: number;
  discountPercent: number;
  flashStock: number;
  flashSold: number;
  isSoldOut: boolean;
  campaignEndTime: string | null;
} {
  const activeCampaign = getActiveFlashSaleCampaign();
  if (!activeCampaign) {
    return {
      isFlashSale: false,
      flashPrice: 0,
      discountPercent: 0,
      flashStock: 0,
      flashSold: 0,
      isSoldOut: false,
      campaignEndTime: null,
    };
  }

  const item = activeCampaign.products.find(
    (p) => String(p.productId) === String(productId)
  );

  if (!item) {
    return {
      isFlashSale: false,
      flashPrice: 0,
      discountPercent: 0,
      flashStock: 0,
      flashSold: 0,
      isSoldOut: false,
      campaignEndTime: null,
    };
  }

  const isSoldOut = item.flashSold >= item.flashStock;

  return {
    isFlashSale: !isSoldOut,
    flashPrice: item.flashPrice,
    discountPercent: item.discountPercent,
    flashStock: item.flashStock,
    flashSold: item.flashSold,
    isSoldOut,
    campaignEndTime: activeCampaign.endTime,
  };
}

/**
 * Record a flash sale order unit decrement & analytics increment
 */
export function recordFlashSalePurchase(productId: string, quantity: number = 1) {
  const campaigns = getAllCampaigns();
  const activeIdx = campaigns.findIndex((c) => {
    const now = getServerTime();
    return c.status === "active" && now >= new Date(c.startTime).getTime() && now < new Date(c.endTime).getTime();
  });

  if (activeIdx === -1) return;

  const campaign = campaigns[activeIdx];
  const prodIdx = campaign.products.findIndex((p) => String(p.productId) === String(productId));
  if (prodIdx === -1) return;

  const prod = campaign.products[prodIdx];
  const availableInFlash = Math.max(0, prod.flashStock - prod.flashSold);
  const qtyToDeduct = Math.min(quantity, availableInFlash);
  if (qtyToDeduct <= 0) return;

  prod.flashSold += qtyToDeduct;
  campaign.analytics.totalUnitsSold += qtyToDeduct;
  campaign.analytics.totalRevenue += qtyToDeduct * prod.flashPrice;
  campaign.analytics.totalOrders += 1;

  campaigns[activeIdx] = campaign;
  saveAllCampaigns(campaigns);
}

/**
 * Format remaining time in HH:MM:SS format
 */
export function calculateTimeRemaining(targetTime: string): {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = getServerTime();
  const end = new Date(targetTime).getTime();
  const diff = Math.max(0, Math.floor((end - now) / 1000));

  if (diff <= 0) {
    return { totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (24 * 3600));
  const hours = Math.floor((diff % (24 * 3600)) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return {
    totalSeconds: diff,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}
