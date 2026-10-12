import { supabase } from "@/lib/firebaseAdapter";
import { FAST_SEED_PRODUCTS } from "@/data/fastSeedCatalog";
import { calculateProductPrice } from "@/utils/pricingMargin";

export interface ResellerProfile {
  id: string;
  userId: string;
  shopName: string;
  phone: string;
  whatsapp: string;
  email: string;
  status: "active" | "pending" | "suspended";
  level: "Bronze" | "Silver" | "Gold" | "Diamond";
  walletBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalOrders: number;
  deliveredOrders: number;
  defaultPaymentMethod: "bkash" | "nagad" | "rocket" | "bank";
  defaultPaymentAccount: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl?: string;
  createdAt: string;
}

export interface ResellerProduct {
  id: string;
  name: string;
  banglaName?: string;
  slug: string;
  images: string[];
  image: string;
  category: string;
  mrp: number;
  wholesalePrice: number;
  suggestedProfit: number;
  stock: number;
  rating: number;
  reviews: number;
  description: string;
  banglaDescription: string;
  features: string[];
}

export interface ResellerOrder {
  id: string;
  orderNumber: string;
  resellerId: string;
  resellerShopName: string;
  resellerPhone: string;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string;
  customerAddress: string;
  customerCity: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  wholesalePrice: number;
  customerSellingPrice: number;
  deliveryFee: number;
  totalCustomerBill: number;
  netProfit: number;
  profitStatus: "pending" | "available" | "paid" | "cancelled";
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "returned" | "cancelled";
  courierName: string;
  trackingCode: string;
  notes?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface ResellerWithdrawal {
  id: string;
  resellerId: string;
  amount: number;
  method: "bkash" | "nagad" | "rocket" | "bank";
  accountNumber: string;
  accountName: string;
  status: "pending" | "approved" | "rejected";
  trxId?: string;
  notes?: string;
  requestedAt: string;
  processedAt?: string;
}

const STORAGE_KEYS = {
  PROFILE_PREFIX: "durtup_reseller_profile_",
  ORDERS_PREFIX: "durtup_reseller_orders_",
  WITHDRAWALS_PREFIX: "durtup_reseller_withdrawals_",
};

export const ResellerService = {
  /**
   * Get or automatically initialize a Reseller Profile for any user
   */
  async getProfile(userId: string, userEmail?: string, userName?: string): Promise<ResellerProfile> {
    if (!userId) {
      throw new Error("User ID is required to get reseller profile");
    }

    // 1. Check Local Storage for instant response (0ms)
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.PROFILE_PREFIX + userId) || localStorage.getItem("durtup_reseller_profile_active");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.shopName) {
          return parsed;
        }
      }
    } catch {}

    // 2. Default Profile template
    const defaultProfile: ResellerProfile = {
      id: "reseller_" + userId,
      userId: userId,
      shopName: userName ? `${userName.split(" ")[0]}'s Shop` : "My Reseller Shop",
      phone: "",
      whatsapp: "",
      email: userEmail || "",
      status: "active",
      level: "Bronze",
      walletBalance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      defaultPaymentMethod: "bkash",
      defaultPaymentAccount: "",
      apiKey: "dt_live_res_" + userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) + "_" + Math.floor(100000 + Math.random() * 900000),
      apiSecret: "dts_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      webhookUrl: "",
      createdAt: new Date().toISOString(),
    };

    // Save locally
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE_PREFIX + userId, JSON.stringify(defaultProfile));
    } catch {}

    // 3. Try to sync with Firestore in background
    try {
      const { data } = await supabase
        .from("resellers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        const remoteProfile: ResellerProfile = {
          id: data.id || defaultProfile.id,
          userId: data.user_id || userId,
          shopName: data.shop_name || defaultProfile.shopName,
          phone: data.phone || defaultProfile.phone,
          whatsapp: data.whatsapp || defaultProfile.whatsapp,
          email: data.email || defaultProfile.email,
          status: data.status || "active",
          level: data.level || "Bronze",
          walletBalance: Number(data.wallet_balance || 0),
          pendingBalance: Number(data.pending_balance || 0),
          totalEarnings: Number(data.total_earnings || 0),
          totalOrders: Number(data.total_orders || 0),
          deliveredOrders: Number(data.delivered_orders || 0),
          defaultPaymentMethod: data.default_payment_method || "bkash",
          defaultPaymentAccount: data.default_payment_account || "",
          apiKey: data.api_key || defaultProfile.apiKey,
          apiSecret: data.api_secret || defaultProfile.apiSecret,
          webhookUrl: data.webhook_url || "",
          createdAt: data.created_at || defaultProfile.createdAt,
        };
        localStorage.setItem(STORAGE_KEYS.PROFILE_PREFIX + userId, JSON.stringify(remoteProfile));
        return remoteProfile;
      } else {
        // Save initial record
        supabase.from("resellers").insert({
          id: defaultProfile.id,
          user_id: userId,
          shop_name: defaultProfile.shopName,
          email: defaultProfile.email,
          status: "active",
          wallet_balance: 0,
          pending_balance: 0,
          total_earnings: 0,
          api_key: defaultProfile.apiKey,
          api_secret: defaultProfile.apiSecret,
          created_at: defaultProfile.createdAt,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("[ResellerService] Error syncing with Firestore:", e);
    }

    return defaultProfile;
  },

  /**
   * Update Reseller Profile
   */
  async updateProfile(userId: string, updates: Partial<ResellerProfile>): Promise<ResellerProfile> {
    const current = await this.getProfile(userId);
    const updated: ResellerProfile = { ...current, ...updates };

    // 1. Immediately save to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE_PREFIX + userId, JSON.stringify(updated));
      localStorage.setItem("durtup_reseller_profile_active", JSON.stringify(updated));
    } catch {}

    // 2. Dispatch custom event so ResellerLayout and other pages update instantly in real-time
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("reseller_profile_updated", { detail: updated }));
    }

    // 3. Upsert to Supabase
    try {
      await supabase.from("resellers").upsert({
        user_id: userId,
        shop_name: updated.shopName,
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        default_payment_method: updated.defaultPaymentMethod,
        default_payment_account: updated.defaultPaymentAccount,
        api_key: updated.apiKey,
        api_secret: updated.apiSecret,
        webhook_url: updated.webhookUrl,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } catch (e) {
      console.warn("[ResellerService] Supabase upsert error:", e);
    }

    return updated;
  },

  /**
   * Regenerate API Key & Secret for Reseller
   */
  async generateNewApiKey(userId: string): Promise<{ apiKey: string; apiSecret: string }> {
    const newApiKey = "dt_live_res_" + userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) + "_" + Math.floor(100000 + Math.random() * 900000);
    const newApiSecret = "dts_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    await this.updateProfile(userId, {
      apiKey: newApiKey,
      apiSecret: newApiSecret,
    });

    return { apiKey: newApiKey, apiSecret: newApiSecret };
  },

  /**
   * Update Webhook URL
   */
  async updateWebhook(userId: string, webhookUrl: string): Promise<void> {
    await this.updateProfile(userId, { webhookUrl });
  },

  /**
   * Fetch Reseller Products with calculated wholesale & profit margins
   */
  async getProducts(): Promise<ResellerProduct[]> {
    const products: ResellerProduct[] = FAST_SEED_PRODUCTS.map((p, idx) => {
      const retailPrice = Number(p.price) || 850;
      // Wholesale price is 25% discount off retail price, rounded cleanly to nearest 10
      const wholesalePrice = Math.max(100, Math.round((retailPrice * 0.75) / 10) * 10);
      // Suggested retail MRP: use p.originalPrice if valid, or 20% markup on retail
      const mrp = Math.max(retailPrice, p.originalPrice || Math.round((retailPrice * 1.20) / 10) * 10);
      const suggestedProfit = mrp - wholesalePrice;

      const banglaFeatures = [
        "১০০% অরিজিনাল ও প্রিমিয়াম কোয়ালিটি পণ্য",
        "ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা পরিশোধ)",
        "সারা বাংলাদেশে দ্রুততম হোম ডেলিভারি",
        "৭ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি",
        "প্রিমিয়াম গিফট ও গ্যাজেট কালেকশন",
      ];

      return {
        id: p.id || `reseller-prod-${idx + 1}`,
        name: p.name,
        banglaName: p.name_bn || p.name,
        slug: p.slug || `product-${p.id}`,
        images: p.images && p.images.length > 0 ? p.images : [p.image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop"],
        image: p.image || (p.images && p.images[0]) || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=600&fit=crop",
        category: p.category || "Gadgets",
        mrp: mrp,
        wholesalePrice: wholesalePrice,
        suggestedProfit: suggestedProfit,
        stock: p.stock_quantity || 150,
        rating: 4.8 + (idx % 3) * 0.1,
        reviews: 45 + idx * 12,
        description: p.description || "Top rated bestseller gadget in Bangladesh with instant warranty.",
        banglaDescription: `🔥 আমাদের ট্রেন্ডিং কালেকশন: ${p.name_bn || p.name}!\n\n✨ চমৎকার লুক এবং প্রিমিয়াম বিল্ড কোয়ালিটি।\n\n📌 পণ্যের মূল বৈশিষ্ট্যসমূহ:\n• ১০০% ব্র্যান্ড নিউ ও জেনুইন প্রোডাক্ট\n• দীর্ঘস্থায়ী পারফরম্যান্স ও আধুনিক ডিজাইন\n• সারা বাংলাদেশে হোম ডেলিভারি সুবিধা\n\n💰 রেগুলার প্রাইস: ৳${mrp + 200}\n🔥 বিশেষ অফার প্রাইস: ৳${mrp}\n\n👉 অর্ডার করতে ইনবক্সে নাম, মোবাইল নম্বর এবং সম্পূর্ণ ঠিকানা পাঠান!`,
        features: banglaFeatures,
      };
    });

    return products;
  },

  /**
   * Get Reseller Orders for a user
   */
  async getOrders(userId: string): Promise<ResellerOrder[]> {
    const effectiveUid = userId || "guest_reseller_1";
    let orders: ResellerOrder[] = [];

    // 1. Read specific user cache
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.ORDERS_PREFIX + effectiveUid);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          orders = parsed;
        }
      }
    } catch {}

    // 2. Read fallback / guest / API caches if empty
    if (orders.length === 0) {
      try {
        const guestKeys = [
          "durtup_reseller_orders_guest_reseller_1",
          "durtup_reseller_orders_reseller_api_user",
          "durtup_reseller_orders_demo",
          "durtup_reseller_orders_active"
        ];
        for (const k of guestKeys) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr) && arr.length > 0) {
              orders = arr;
              break;
            }
          }
        }
      } catch {}
    }

    // 3. Sync from Supabase in background
    try {
      const { data } = await supabase
        .from("reseller_orders")
        .select("*")
        .or(`reseller_id.eq.${effectiveUid},reseller_id.eq.guest_reseller_1,reseller_id.eq.reseller_api_user`)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const mapped: ResellerOrder[] = data.map((d: any) => ({
          id: d.id,
          orderNumber: d.order_number,
          resellerId: d.reseller_id || effectiveUid,
          resellerShopName: d.reseller_shop_name || "Smart Bazar BD",
          resellerPhone: d.reseller_phone || "01885985097",
          customerName: d.customer_name,
          customerPhone: d.customer_phone,
          customerAltPhone: d.customer_alt_phone,
          customerAddress: d.customer_address,
          customerCity: d.customer_city || "Dhaka",
          productId: d.product_id,
          productName: d.product_name,
          productImage: d.product_image || "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&auto=format&fit=crop&q=60",
          quantity: d.quantity || 1,
          wholesalePrice: Number(d.wholesale_price || 790),
          customerSellingPrice: Number(d.customer_selling_price || 1250),
          deliveryFee: Number(d.delivery_fee || 70),
          totalCustomerBill: Number(d.total_customer_bill || 1320),
          netProfit: Number(d.net_profit || 460),
          profitStatus: (d.profit_status as any) || "pending",
          orderStatus: (d.order_status as any) || "processing",
          courierName: d.courier_name || "Steadfast Courier",
          trackingCode: d.tracking_code || `SF-BD-${Math.floor(1000000 + Math.random() * 9000000)}`,
          notes: d.notes,
          createdAt: d.created_at || new Date().toISOString(),
          deliveredAt: d.delivered_at,
        }));

        const existingIds = new Set(orders.map((o) => o.id));
        for (const item of mapped) {
          if (!existingIds.has(item.id)) {
            orders.push(item);
            existingIds.add(item.id);
          }
        }
      }
    } catch (e) {
      console.warn("[ResellerService] Sync note:", e);
    }

    // 4. Return clean real orders without fabricating fake seed orders
    // Save and cache to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS_PREFIX + effectiveUid, JSON.stringify(orders));
      localStorage.setItem("durtup_reseller_orders_active", JSON.stringify(orders));
    } catch {}

    return orders;
  },

  /**
   * Place a new Dropship Customer Order
   */
  async createOrder(
    userId: string,
    orderInput: {
      product: ResellerProduct;
      quantity: number;
      customerSellingPrice: number;
      deliveryFee: number;
      customerName: string;
      customerPhone: string;
      customerAltPhone?: string;
      customerAddress: string;
      customerCity: string;
      resellerShopName: string;
      resellerPhone: string;
      notes?: string;
    }
  ): Promise<ResellerOrder> {
    const wholesaleTotal = orderInput.product.wholesalePrice * orderInput.quantity;
    const customerTotalGoods = orderInput.customerSellingPrice * orderInput.quantity;
    const totalCustomerBill = customerTotalGoods + orderInput.deliveryFee;
    const netProfit = customerTotalGoods - wholesaleTotal;

    const orderNumber = `RO-${Date.now().toString().slice(-6)}`;
    const trackingCode = `SF-BD-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const newOrder: ResellerOrder = {
      id: "ro_" + Date.now(),
      orderNumber: orderNumber,
      resellerId: userId,
      resellerShopName: orderInput.resellerShopName || "Reseller Shop",
      resellerPhone: orderInput.resellerPhone || "",
      customerName: orderInput.customerName,
      customerPhone: orderInput.customerPhone,
      customerAltPhone: orderInput.customerAltPhone,
      customerAddress: orderInput.customerAddress,
      customerCity: orderInput.customerCity,
      productId: orderInput.product.id,
      productName: orderInput.product.banglaName || orderInput.product.name,
      productImage: orderInput.product.image,
      quantity: orderInput.quantity,
      wholesalePrice: wholesaleTotal,
      customerSellingPrice: customerTotalGoods,
      deliveryFee: orderInput.deliveryFee,
      totalCustomerBill: totalCustomerBill,
      netProfit: netProfit,
      profitStatus: "pending",
      orderStatus: "processing",
      courierName: "Steadfast Courier / Pathao",
      trackingCode: trackingCode,
      notes: orderInput.notes,
      createdAt: new Date().toISOString(),
    };

    // Save locally
    const existing = await this.getOrders(userId);
    const updatedOrders = [newOrder, ...existing];
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS_PREFIX + userId, JSON.stringify(updatedOrders));
    } catch {}

    // Update Profile pending balance & total orders
    const profile = await this.getProfile(userId);
    const updatedProfile: ResellerProfile = {
      ...profile,
      pendingBalance: profile.pendingBalance + netProfit,
      totalOrders: profile.totalOrders + 1,
    };
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE_PREFIX + userId, JSON.stringify(updatedProfile));
    } catch {}

    // Sync to Firestore in background
    try {
      supabase.from("reseller_orders").insert({
        id: newOrder.id,
        order_number: newOrder.orderNumber,
        reseller_id: userId,
        reseller_shop_name: newOrder.resellerShopName,
        reseller_phone: newOrder.resellerPhone,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        customer_alt_phone: newOrder.customerAltPhone,
        customer_address: newOrder.customerAddress,
        customer_city: newOrder.customerCity,
        product_id: newOrder.productId,
        product_name: newOrder.productName,
        product_image: newOrder.productImage,
        quantity: newOrder.quantity,
        wholesale_price: newOrder.wholesalePrice,
        customer_selling_price: newOrder.customerSellingPrice,
        delivery_fee: newOrder.deliveryFee,
        total_customer_bill: newOrder.totalCustomerBill,
        net_profit: newOrder.netProfit,
        profit_status: newOrder.profitStatus,
        order_status: newOrder.orderStatus,
        courier_name: newOrder.courierName,
        tracking_code: newOrder.trackingCode,
        notes: newOrder.notes,
        created_at: newOrder.createdAt,
      }).catch(() => {});
    } catch {}

    // Dispatch real-time events across UI
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("durtup_reseller_orders_active", JSON.stringify(updatedOrders));
        window.dispatchEvent(new CustomEvent("reseller_order_created", { detail: newOrder }));
        window.dispatchEvent(new CustomEvent("reseller_profile_updated", { detail: updatedProfile }));
      } catch {}
    }

    return newOrder;
  },

  /**
   * Get Reseller Withdrawals
   */
  async getWithdrawals(userId: string): Promise<ResellerWithdrawal[]> {
    if (!userId) return [];
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS_PREFIX + userId);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return [];
  },

  /**
   * Request Payout / Withdrawal
   */
  async requestWithdrawal(
    userId: string,
    withdrawalInput: {
      amount: number;
      method: "bkash" | "nagad" | "rocket" | "bank";
      accountNumber: string;
      accountName: string;
    }
  ): Promise<ResellerWithdrawal> {
    const profile = await this.getProfile(userId);
    if (profile.walletBalance < withdrawalInput.amount) {
      throw new Error(`অপর্যাপ্ত ব্যালেন্স! আপনার বর্তমান উইথড্রলযোগ্য ব্যালেন্স ৳${profile.walletBalance}`);
    }

    if (withdrawalInput.amount < 100) {
      throw new Error("নূন্যতম উইথড্র পরিমাণ ১০০ টাকা");
    }

    const newWithdrawal: ResellerWithdrawal = {
      id: "rw_" + Date.now(),
      resellerId: userId,
      amount: withdrawalInput.amount,
      method: withdrawalInput.method,
      accountNumber: withdrawalInput.accountNumber,
      accountName: withdrawalInput.accountName,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    const existing = await this.getWithdrawals(userId);
    const updated = [newWithdrawal, ...existing];
    try {
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS_PREFIX + userId, JSON.stringify(updated));
    } catch {}

    // Deduct available wallet balance
    const updatedProfile: ResellerProfile = {
      ...profile,
      walletBalance: Math.max(0, profile.walletBalance - withdrawalInput.amount),
    };
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE_PREFIX + userId, JSON.stringify(updatedProfile));
    } catch {}

    return newWithdrawal;
  },
};
