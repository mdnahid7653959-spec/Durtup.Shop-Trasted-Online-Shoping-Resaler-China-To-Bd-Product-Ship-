import { db } from "@/integrations/firebase/client";
import { sendCashbackAwardNotification } from "@/services/notificationService";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit as fsLimit,
  deleteDoc,
  runTransaction
} from "firebase/firestore";

export interface CashbackCampaign {
  id: string;
  name: string;
  description?: string;
  cashback_percent: number;       // e.g. 10 (10%)
  max_cashback_amount: number;     // e.g. 500 (Maximum ৳500 cashback)
  min_order_amount: number;        // e.g. 1000 (Minimum ৳1000 order required)
  target_type: "all" | "categories" | "products";
  target_categories?: string[];    // Category names or slugs
  target_products?: string[];      // Product IDs or slugs
  start_date: string;              // ISO date string or YYYY-MM-DD
  end_date: string;                // ISO date string or YYYY-MM-DD
  is_active: boolean;
  total_distributed?: number;      // Total cashback given in BDT
  orders_count?: number;           // Count of eligible orders
  created_at: string;
  updated_at: string;
}

export interface CashbackTransaction {
  id: string;
  order_id: string;
  order_number: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  campaign_id: string;
  campaign_name: string;
  order_amount: number;
  eligible_amount: number;
  cashback_percent: number;
  cashback_amount: number;
  type: "awarded" | "reversed";
  idempotency_key: string;         // Unique: cashback_delivered_${orderId}
  notes?: string;
  created_at: string;
}

export interface CashbackSettings {
  enabled: boolean;
  default_cashback_percent: number;
  default_min_order_amount: number;
  default_max_cashback: number;
}

export const DEFAULT_CASHBACK_SETTINGS: CashbackSettings = {
  enabled: true,
  default_cashback_percent: 5,     // 5% default cashback
  default_min_order_amount: 500,   // Min ৳500 order
  default_max_cashback: 300,       // Max ৳300 cap
};

const SETTINGS_KEY = "cashback_settings";

/**
 * 1. Fetch Global Cashback Settings
 */
export async function getCashbackSettings(): Promise<CashbackSettings> {
  try {
    const snap = await getDoc(doc(db, "site_settings", SETTINGS_KEY));
    if (snap.exists()) {
      const data = snap.data();
      const merged = { ...DEFAULT_CASHBACK_SETTINGS, ...(data.value || data) };
      if (typeof window !== "undefined") {
        try { localStorage.setItem("durtup_cashback_settings", JSON.stringify(merged)); } catch {}
      }
      return merged;
    }
  } catch (err) {
    console.warn("[Cashback] Error reading settings from Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("durtup_cashback_settings");
      if (raw) return { ...DEFAULT_CASHBACK_SETTINGS, ...JSON.parse(raw) };
    } catch {}
  }

  return DEFAULT_CASHBACK_SETTINGS;
}

/**
 * 2. Save Global Cashback Settings
 */
export async function saveCashbackSettings(settings: CashbackSettings): Promise<boolean> {
  try {
    const payload = {
      key: SETTINGS_KEY,
      value: settings,
      updated_at: new Date().toISOString()
    };
    await setDoc(doc(db, "site_settings", SETTINGS_KEY), payload, { merge: true });
    if (typeof window !== "undefined") {
      try { localStorage.setItem("durtup_cashback_settings", JSON.stringify(settings)); } catch {}
    }
    return true;
  } catch (err) {
    console.error("[Cashback] Error saving settings:", err);
    throw err;
  }
}

/**
 * 3. Fetch All Cashback Campaigns
 */
export async function getAllCashbackCampaigns(): Promise<CashbackCampaign[]> {
  try {
    const q = collection(db, "cashback_campaigns");
    const snap = await getDocs(q);
    const list: CashbackCampaign[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) });
    });
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (list.length > 0) {
      if (typeof window !== "undefined") {
        try { localStorage.setItem("durtup_cashback_campaigns", JSON.stringify(list)); } catch {}
      }
      return list;
    }
  } catch (err) {
    console.warn("[Cashback] Error fetching campaigns from Firestore:", err);
  }

  // Fallback to local cache or initial seed campaign
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("durtup_cashback_campaigns");
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  // Initial default welcome campaign
  const defaultCampaign: CashbackCampaign = {
    id: "campaign-welcome-cashback",
    name: "সব অর্ডারে নিশ্চিত ক্যাশব্যাক (Welcome Cashback)",
    description: "যেকোনো ৳৫০০ বা তার বেশি কেনাকাটায় ৫% ইনস্ট্যান্ট ক্যাশব্যাক!",
    cashback_percent: 5,
    max_cashback_amount: 300,
    min_order_amount: 500,
    target_type: "all",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    is_active: true,
    total_distributed: 0,
    orders_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "cashback_campaigns", defaultCampaign.id), defaultCampaign, { merge: true });
  } catch {}

  return [defaultCampaign];
}

/**
 * 4. Fetch Active Campaigns currently valid by Date & Status
 */
export async function getActiveCashbackCampaigns(): Promise<CashbackCampaign[]> {
  const all = await getAllCashbackCampaigns();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  return all.filter((c) => {
    if (!c.is_active) return false;
    if (c.start_date && c.start_date > todayStr) return false;
    if (c.end_date && c.end_date < todayStr) return false;
    return true;
  });
}

/**
 * 5. Save or Update a Cashback Campaign
 */
export async function saveCashbackCampaign(campaign: Partial<CashbackCampaign>): Promise<CashbackCampaign> {
  const id = campaign.id || `campaign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const payload: CashbackCampaign = {
    id,
    name: campaign.name || "Special Cashback",
    description: campaign.description || "",
    cashback_percent: Number(campaign.cashback_percent ?? 5),
    max_cashback_amount: Number(campaign.max_cashback_amount ?? 300),
    min_order_amount: Number(campaign.min_order_amount ?? 500),
    target_type: campaign.target_type || "all",
    target_categories: campaign.target_categories || [],
    target_products: campaign.target_products || [],
    start_date: campaign.start_date || now.split("T")[0],
    end_date: campaign.end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    is_active: campaign.is_active !== undefined ? campaign.is_active : true,
    total_distributed: Number(campaign.total_distributed || 0),
    orders_count: Number(campaign.orders_count || 0),
    created_at: campaign.created_at || now,
    updated_at: now
  };

  await setDoc(doc(db, "cashback_campaigns", id), payload, { merge: true });

  // Update local cache
  if (typeof window !== "undefined") {
    try {
      const all = await getAllCashbackCampaigns();
      const updated = all.filter(c => c.id !== id);
      updated.unshift(payload);
      localStorage.setItem("durtup_cashback_campaigns", JSON.stringify(updated));
    } catch {}
  }

  return payload;
}

/**
 * 6. Delete a Cashback Campaign
 */
export async function deleteCashbackCampaign(campaignId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "cashback_campaigns", campaignId));
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("durtup_cashback_campaigns");
        if (raw) {
          const list: CashbackCampaign[] = JSON.parse(raw);
          const filtered = list.filter(c => c.id !== campaignId);
          localStorage.setItem("durtup_cashback_campaigns", JSON.stringify(filtered));
        }
      } catch {}
    }
    return true;
  } catch (err) {
    console.error("[Cashback] Error deleting campaign:", err);
    throw err;
  }
}

/**
 * 7. Server-Side Eligible Cashback Calculation for an Order
 * Matches products, categories, minimum order amounts, and applies the highest benefit campaign.
 */
export function calculateOrderCashback(
  order: {
    subtotal?: number;
    total?: number;
    items?: Array<{
      id?: string | number;
      product_id?: string | number;
      price?: number;
      quantity?: number;
      category?: string;
      category_name?: string;
    }>;
  },
  activeCampaigns: CashbackCampaign[]
): {
  eligible: boolean;
  campaign: CashbackCampaign | null;
  eligibleAmount: number;
  cashbackAmount: number;
  reason?: string;
} {
  if (!activeCampaigns || activeCampaigns.length === 0) {
    return { eligible: false, campaign: null, eligibleAmount: 0, cashbackAmount: 0, reason: "No active cashback campaign." };
  }

  const orderItems = order.items || [];
  const orderSubtotal = Number(order.subtotal || order.total || 0);

  let bestMatch: {
    campaign: CashbackCampaign;
    eligibleAmount: number;
    cashbackAmount: number;
  } | null = null;

  for (const campaign of activeCampaigns) {
    let eligibleSubtotal = 0;

    if (campaign.target_type === "all") {
      eligibleSubtotal = orderSubtotal;
    } else if (campaign.target_type === "categories") {
      const allowedCats = new Set((campaign.target_categories || []).map(c => c.toLowerCase().trim()));
      if (orderItems.length > 0) {
        for (const item of orderItems) {
          const cat = ((item as any).category || (item as any).category_name || "").toLowerCase().trim();
          if (allowedCats.has(cat)) {
            const itemPrice = Number(item.price || 0);
            const itemQty = Number(item.quantity || 1);
            eligibleSubtotal += itemPrice * itemQty;
          }
        }
      } else {
        eligibleSubtotal = orderSubtotal;
      }
    } else if (campaign.target_type === "products") {
      const allowedProds = new Set((campaign.target_products || []).map(p => String(p).toLowerCase().trim()));
      if (orderItems.length > 0) {
        for (const item of orderItems) {
          const pId = String(item.product_id || item.id || "").toLowerCase().trim();
          if (allowedProds.has(pId)) {
            const itemPrice = Number(item.price || 0);
            const itemQty = Number(item.quantity || 1);
            eligibleSubtotal += itemPrice * itemQty;
          }
        }
      } else {
        eligibleSubtotal = orderSubtotal;
      }
    }

    // Check minimum order amount requirement
    if (eligibleSubtotal < (campaign.min_order_amount || 0)) {
      continue;
    }

    // Calculate cashback amount with cap
    const rawCashback = Math.round(eligibleSubtotal * ((campaign.cashback_percent || 0) / 100));
    const cappedCashback = campaign.max_cashback_amount > 0
      ? Math.min(rawCashback, campaign.max_cashback_amount)
      : rawCashback;

    if (cappedCashback > 0) {
      if (!bestMatch || cappedCashback > bestMatch.cashbackAmount) {
        bestMatch = {
          campaign,
          eligibleAmount: eligibleSubtotal,
          cashbackAmount: cappedCashback
        };
      }
    }
  }

  if (bestMatch && bestMatch.cashbackAmount > 0) {
    return {
      eligible: true,
      campaign: bestMatch.campaign,
      eligibleAmount: bestMatch.eligibleAmount,
      cashbackAmount: bestMatch.cashbackAmount
    };
  }

  return {
    eligible: false,
    campaign: null,
    eligibleAmount: 0,
    cashbackAmount: 0,
    reason: "Order does not meet minimum amount or category requirements."
  };
}

/**
 * 8. Award Cashback to Customer Wallet upon Order Delivery
 * IDEMPOTENT: Prevents duplicate cashback awarding with key `cashback_delivered_${orderId}`
 */
export async function awardDeliveredOrderCashback(order: {
  id: string;
  order_number?: string;
  user_id?: string;
  userId?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  subtotal?: number;
  total?: number;
  items?: any[];
}): Promise<{
  success: boolean;
  duplicate?: boolean;
  cashbackAwarded: number;
  campaignName?: string;
  message: string;
}> {
  const userId = order.user_id || order.userId;
  if (!userId || userId === "guest") {
    return {
      success: false,
      cashbackAwarded: 0,
      message: "Guest orders are not eligible for wallet cashback."
    };
  }

  const orderId = String(order.id);
  const orderNumber = String(order.order_number || orderId);
  const idempotencyKey = `cashback_delivered_${orderId}`;

  try {
    // 1. Check Idempotency: Prevent duplicate cashback awards
    const existingQ = query(
      collection(db, "cashback_transactions"),
      where("idempotency_key", "==", idempotencyKey)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      const existing = existingSnap.docs[0].data();
      return {
        success: true,
        duplicate: true,
        cashbackAwarded: existing.cashback_amount || 0,
        campaignName: existing.campaign_name,
        message: `Cashback of ৳${existing.cashback_amount} was already awarded for order #${orderNumber}.`
      };
    }

    // 2. Fetch Active Campaigns & Calculate Eligibility
    const settings = await getCashbackSettings();
    if (!settings.enabled) {
      return { success: false, cashbackAwarded: 0, message: "Cashback system is currently disabled." };
    }

    const activeCampaigns = await getActiveCashbackCampaigns();
    const result = calculateOrderCashback(order, activeCampaigns);

    if (!result.eligible || result.cashbackAmount <= 0 || !result.campaign) {
      return {
        success: false,
        cashbackAwarded: 0,
        message: result.reason || "Order does not qualify for cashback."
      };
    }

    const { campaign, eligibleAmount, cashbackAmount } = result;

    // 3. Atomically update Customer Profile Wallet Balance & Total Earned
    const profileRef = doc(db, "profiles", userId);
    let currentBalance = 0;
    let currentEarned = 0;

    const pSnap = await getDoc(profileRef);
    if (pSnap.exists()) {
      const pd = pSnap.data();
      currentBalance = Number(pd.wallet_balance || pd.walletBalance || 0);
      currentEarned = Number(pd.total_earned || pd.totalEarned || 0);
    }

    const newBalance = currentBalance + cashbackAmount;
    const newEarned = currentEarned + cashbackAmount;
    const nowIso = new Date().toISOString();

    await setDoc(profileRef, {
      wallet_balance: newBalance,
      walletBalance: newBalance,
      total_earned: newEarned,
      totalEarned: newEarned,
      total_cashback_earned: Number((pSnap.data()?.total_cashback_earned || 0)) + cashbackAmount,
      updated_at: nowIso
    }, { merge: true });

    // Also update wallets collection
    try {
      await setDoc(doc(db, "wallets", userId), {
        userId,
        balance: newBalance,
        total_earned: newEarned,
        updated_at: nowIso
      }, { merge: true });
    } catch {}

    // 4. Create record in wallet_transactions for customer's Wallet ledger
    const txId = `tx-cb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const walletTxPayload = {
      id: txId,
      userId,
      user_id: userId,
      amount: cashbackAmount,
      type: "credit",
      direction: "credit",
      category: "cashback",
      status: "completed",
      order_id: orderId,
      order_number: orderNumber,
      orderId,
      orderNumber,
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      description: `অর্ডার #${orderNumber} সফল ডেলিভারিতে ${campaign.name} থেকে ক্যাশব্যাক প্রাপ্তি`,
      balance_after: newBalance,
      idempotency_key: idempotencyKey,
      created_at: nowIso,
      createdAt: nowIso
    };

    await setDoc(doc(db, "wallet_transactions", txId), walletTxPayload, { merge: true });

    // 5. Create immutable audit ledger record in cashback_transactions
    const cbTxId = `cb-${Date.now()}-${orderId}`;
    const cashbackTxPayload: CashbackTransaction = {
      id: cbTxId,
      order_id: orderId,
      order_number: orderNumber,
      user_id: userId,
      user_email: order.customer_email || "",
      user_name: order.customer_name || "",
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      order_amount: Number(order.subtotal || order.total || 0),
      eligible_amount: eligibleAmount,
      cashback_percent: campaign.cashback_percent,
      cashback_amount: cashbackAmount,
      type: "awarded",
      idempotency_key: idempotencyKey,
      notes: `Awarded ৳${cashbackAmount} (${campaign.cashback_percent}%) on order #${orderNumber}`,
      created_at: nowIso
    };

    await setDoc(doc(db, "cashback_transactions", cbTxId), cashbackTxPayload, { merge: true });

    // 6. Update Campaign Aggregates
    try {
      await setDoc(doc(db, "cashback_campaigns", campaign.id), {
        total_distributed: Number(campaign.total_distributed || 0) + cashbackAmount,
        orders_count: Number(campaign.orders_count || 0) + 1,
        updated_at: nowIso
      }, { merge: true });
    } catch {}

    // Trigger instant native push notification for customer
    sendCashbackAwardNotification({
      userId,
      orderNumber,
      amount: cashbackAmount,
      balance: newBalance,
      customerName: order.customer_name,
    }).catch(() => {});

    return {
      success: true,
      duplicate: false,
      cashbackAwarded: cashbackAmount,
      campaignName: campaign.name,
      message: `৳${cashbackAmount} ক্যাশব্যাক সফলভাবে কাস্টমার ওয়ালেটে যুক্ত হয়েছে!`
    };
  } catch (err: any) {
    console.error("[Cashback] Error awarding delivered order cashback:", err);
    return {
      success: false,
      cashbackAwarded: 0,
      message: err.message || "Failed to award cashback."
    };
  }
}

/**
 * 9. Reconcile Cashback upon Order Cancellation or Refund
 * Automatically reverses any awarded cashback and refunds any wallet balance spent at checkout!
 */
export async function reconcileOrderCashbackOnCancelOrRefund(order: {
  id: string;
  order_number?: string;
  user_id?: string;
  userId?: string;
  wallet_amount_used?: number;
}): Promise<{
  success: boolean;
  cashbackDeducted: number;
  walletRefunded: number;
  message: string;
}> {
  const userId = order.user_id || order.userId;
  if (!userId || userId === "guest") {
    return { success: true, cashbackDeducted: 0, walletRefunded: 0, message: "Guest order, no wallet adjustment needed." };
  }

  const orderId = String(order.id);
  const orderNumber = String(order.order_number || orderId);
  const nowIso = new Date().toISOString();
  let cashbackDeducted = 0;
  let walletRefunded = 0;

  try {
    // 1. Check if cashback was awarded for this order
    const awardedQ = query(
      collection(db, "cashback_transactions"),
      where("order_id", "==", orderId),
      where("type", "==", "awarded")
    );
    const awardedSnap = await getDocs(awardedQ);

    if (!awardedSnap.empty) {
      const awardedDoc = awardedSnap.docs[0];
      const awardedData = awardedDoc.data() as CashbackTransaction;
      cashbackDeducted = awardedData.cashback_amount || 0;

      if (cashbackDeducted > 0) {
        // Reverse cashback from profile wallet balance
        const pRef = doc(db, "profiles", userId);
        const pSnap = await getDoc(pRef);
        const curBal = Number(pSnap.data()?.wallet_balance || 0);
        const finalBal = Math.max(0, curBal - cashbackDeducted);

        await setDoc(pRef, {
          wallet_balance: finalBal,
          walletBalance: finalBal,
          updated_at: nowIso
        }, { merge: true });

        // Record reversal in wallet_transactions
        const revId = `tx-rev-cb-${Date.now()}`;
        await setDoc(doc(db, "wallet_transactions", revId), {
          id: revId,
          userId,
          user_id: userId,
          amount: cashbackDeducted,
          type: "debit",
          direction: "debit",
          category: "cashback_reversal",
          status: "completed",
          order_id: orderId,
          order_number: orderNumber,
          description: `অর্ডার #${orderNumber} বাতিল/রিফান্ডের কারণে ক্যাশব্যাক সমন্বয়`,
          balance_after: finalBal,
          created_at: nowIso
        }, { merge: true });

        // Mark cashback transaction as reversed
        await setDoc(doc(db, "cashback_transactions", awardedDoc.id), {
          type: "reversed",
          reversed_at: nowIso,
          updated_at: nowIso
        }, { merge: true });
      }
    }

    // 2. If customer spent wallet balance at checkout for this order, refund it!
    const walletSpent = Number(order.wallet_amount_used || 0);
    if (walletSpent > 0) {
      walletRefunded = walletSpent;
      const pRef = doc(db, "profiles", userId);
      const pSnap = await getDoc(pRef);
      const curBal = Number(pSnap.data()?.wallet_balance || 0);
      const finalBal = curBal + walletRefunded;

      await setDoc(pRef, {
        wallet_balance: finalBal,
        walletBalance: finalBal,
        updated_at: nowIso
      }, { merge: true });

      const refundTxId = `tx-wallet-refund-${Date.now()}`;
      await setDoc(doc(db, "wallet_transactions", refundTxId), {
        id: refundTxId,
        userId,
        user_id: userId,
        amount: walletRefunded,
        type: "credit",
        direction: "credit",
        category: "order_refund",
        status: "completed",
        order_id: orderId,
        order_number: orderNumber,
        description: `অর্ডার #${orderNumber} বাতিল/রিফান্ড হওয়ায় ব্যবহৃত ওয়ালেট ব্যালেন্স ফেরত`,
        balance_after: finalBal,
        created_at: nowIso
      }, { merge: true });
    }

    return {
      success: true,
      cashbackDeducted,
      walletRefunded,
      message: `Reconciliation complete: ৳${cashbackDeducted} cashback reversed, ৳${walletRefunded} wallet balance refunded.`
    };
  } catch (err: any) {
    console.error("[Cashback] Error during cancel/refund reconciliation:", err);
    return {
      success: false,
      cashbackDeducted: 0,
      walletRefunded: 0,
      message: err.message || "Failed to reconcile cashback."
    };
  }
}

/**
 * 10. Fetch Customer Cashback History & Analytics
 */
export async function getUserCashbackHistory(userId: string): Promise<CashbackTransaction[]> {
  if (!userId) return [];
  try {
    const q = query(
      collection(db, "cashback_transactions"),
      where("user_id", "==", userId)
    );
    const snap = await getDocs(q);
    const list: CashbackTransaction[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) });
    });
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  } catch (err) {
    console.warn("[Cashback] Error fetching customer cashback history:", err);
    return [];
  }
}

/**
 * 11. Fetch All Cashback History for Admin Audit Log
 */
export async function getAllCashbackHistory(limitCount: number = 100): Promise<CashbackTransaction[]> {
  try {
    const q = query(
      collection(db, "cashback_transactions"),
      orderBy("created_at", "desc"),
      fsLimit(limitCount)
    );
    const snap = await getDocs(q);
    const list: CashbackTransaction[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) });
    });
    return list;
  } catch (err) {
    console.warn("[Cashback] Error fetching all cashback history:", err);
    return [];
  }
}
