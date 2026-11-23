import { db } from "@/integrations/firebase/client";
import { sendLoyaltyEarnedNotification } from "@/services/notificationService";
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
  runTransaction
} from "firebase/firestore";

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerHundredSpent: number; // e.g. 5 points per ৳100 spent
  pointValueInTaka: number;      // e.g. 0.50 Taka per point (100 points = ৳50)
  minPointsToRedeem: number;     // e.g. 50 points
  maxPointsRedemptionPercent: number; // e.g. 50% max discount from points
  expiryDays: number;            // e.g. 365 days (0 = no expiry)
  bronzeThreshold: number;       // 0
  silverThreshold: number;       // 500
  goldThreshold: number;         // 2000
  platinumThreshold: number;     // 5000
}

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: true,
  pointsPerHundredSpent: 5,      // 5 points per ৳100 spent
  pointValueInTaka: 0.50,        // 1 point = ৳0.50 (100 points = ৳50 discount)
  minPointsToRedeem: 50,         // Minimum 50 points to redeem
  maxPointsRedemptionPercent: 50,// Up to 50% of subtotal can be paid via points
  expiryDays: 365,               // 365 days validity
  bronzeThreshold: 0,
  silverThreshold: 500,
  goldThreshold: 2000,
  platinumThreshold: 5000,
};

export interface LoyaltyAccount {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  points: number;
  lifetime_points: number;
  points_spent: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  user_email?: string;
  points: number;               // Positive (earn/bonus/refund) or Negative (redeem/reconcile)
  type: 
    | "order_delivered" 
    | "checkout_redeemed" 
    | "order_refunded" 
    | "admin_bonus" 
    | "admin_adjustment" 
    | "points_expired";
  order_id?: string;
  order_number?: string;
  order_amount?: number;
  description: string;
  balance_after: number;
  idempotency_key: string;
  expires_at?: string | null;
  created_at: string;
}

const SETTINGS_KEY = "loyalty_settings";

/**
 * Helper to determine tier from lifetime points
 */
export function calculateTier(lifetimePoints: number, settings: LoyaltySettings): "bronze" | "silver" | "gold" | "platinum" {
  if (lifetimePoints >= settings.platinumThreshold) return "platinum";
  if (lifetimePoints >= settings.goldThreshold) return "gold";
  if (lifetimePoints >= settings.silverThreshold) return "silver";
  return "bronze";
}

/**
 * 1. Get Loyalty Settings from Firestore or LocalStorage cache
 */
export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  try {
    const snap = await getDoc(doc(db, "site_settings", SETTINGS_KEY));
    if (snap.exists()) {
      const data = snap.data();
      const merged = { ...DEFAULT_LOYALTY_SETTINGS, ...(data.value || data) };
      if (typeof window !== "undefined") {
        try { localStorage.setItem("durtup_loyalty_settings", JSON.stringify(merged)); } catch {}
      }
      return merged;
    }
  } catch (err) {
    console.warn("[Loyalty] Error fetching settings from Firestore:", err);
  }

  // Fallback to local storage or defaults
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("durtup_loyalty_settings");
      if (raw) return { ...DEFAULT_LOYALTY_SETTINGS, ...JSON.parse(raw) };
    } catch {}
  }

  return DEFAULT_LOYALTY_SETTINGS;
}

/**
 * 2. Save Loyalty Settings to Firestore & Local Storage
 */
export async function saveLoyaltySettings(settings: LoyaltySettings): Promise<boolean> {
  try {
    const payload = {
      key: SETTINGS_KEY,
      value: settings,
      updated_at: new Date().toISOString()
    };
    await setDoc(doc(db, "site_settings", SETTINGS_KEY), payload, { merge: true });
    if (typeof window !== "undefined") {
      try { localStorage.setItem("durtup_loyalty_settings", JSON.stringify(settings)); } catch {}
    }
    return true;
  } catch (err) {
    console.error("[Loyalty] Error saving settings:", err);
    throw err;
  }
}

/**
 * 3. Fetch User Loyalty Account (Points, Tier, Lifetime)
 */
export async function getUserLoyaltyAccount(userId: string, userEmail?: string, userName?: string): Promise<LoyaltyAccount> {
  if (!userId) {
    return {
      id: "guest",
      user_id: "guest",
      points: 0,
      lifetime_points: 0,
      points_spent: 0,
      tier: "bronze",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  try {
    const docRef = doc(db, "loyalty_points", userId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data() as any;
      const settings = await getLoyaltySettings();
      const lifetime = Number(data.lifetime_points || data.points || 0);
      const tier = calculateTier(lifetime, settings);

      const account: LoyaltyAccount = {
        id: snap.id,
        user_id: userId,
        user_email: data.user_email || userEmail || "",
        user_name: data.user_name || userName || "",
        points: Math.max(0, Number(data.points || 0)),
        lifetime_points: lifetime,
        points_spent: Number(data.points_spent || 0),
        tier,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };

      // Cache locally
      if (typeof window !== "undefined") {
        try { localStorage.setItem(`durtup_loyalty_${userId}`, JSON.stringify(account)); } catch {}
      }

      return account;
    }
  } catch (err) {
    console.warn("[Loyalty] Error fetching loyalty account:", err);
  }

  // Check local cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`durtup_loyalty_${userId}`);
      if (cached) return JSON.parse(cached);
    } catch {}
  }

  // Default initial account
  const initialAccount: LoyaltyAccount = {
    id: userId,
    user_id: userId,
    user_email: userEmail || "",
    user_name: userName || "",
    points: 0,
    lifetime_points: 0,
    points_spent: 0,
    tier: "bronze",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "loyalty_points", userId), initialAccount, { merge: true });
  } catch {}

  return initialAccount;
}

/**
 * 4. Fetch User Points History (Transaction Ledger)
 */
export async function getUserLoyaltyHistory(userId: string): Promise<LoyaltyTransaction[]> {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, "loyalty_history"),
      where("user_id", "==", userId)
    );
    const snap = await getDocs(q);
    const list: LoyaltyTransaction[] = [];

    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) });
    });

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  } catch (err) {
    console.warn("[Loyalty] Error fetching user history from Firestore:", err);

    // Fallback local storage ledger
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`durtup_loyalty_history_${userId}`);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  }
}

/**
 * 5. Calculate Points Earnable for a given Order Spend Amount
 */
export function calculateEarnablePoints(amount: number, settings: LoyaltySettings): number {
  if (!settings.enabled || !amount || amount <= 0) return 0;
  // Points = floor((Amount / 100) * pointsPerHundredSpent)
  return Math.floor((amount / 100) * (settings.pointsPerHundredSpent || 5));
}

/**
 * 6. Award Loyalty Points upon Order Delivery
 * IDEMPOTENT: Prevents double-awarding via idempotency key `order_delivered_${orderId}`
 */
export async function awardDeliveredOrderPoints(order: {
  id: string;
  order_number?: string;
  user_id?: string;
  userId?: string;
  customer_email?: string;
  customer_name?: string;
  total?: number;
  subtotal?: number;
}): Promise<{ success: boolean; duplicate?: boolean; pointsAwarded: number; message: string }> {
  const userId = order.user_id || order.userId;
  if (!userId || userId === "guest") {
    return { success: false, pointsAwarded: 0, message: "Guest orders are not eligible for loyalty points." };
  }

  const orderId = String(order.id);
  const idempotencyKey = `order_delivered_${orderId}`;

  try {
    // 1. Check Idempotency in Firestore
    const existingQ = query(
      collection(db, "loyalty_history"),
      where("idempotency_key", "==", idempotencyKey)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      const existingData = existingSnap.docs[0].data();
      return {
        success: true,
        duplicate: true,
        pointsAwarded: existingData.points || 0,
        message: `Points already awarded previously for order #${order.order_number || orderId}.`
      };
    }

    const settings = await getLoyaltySettings();
    if (!settings.enabled) {
      return { success: false, pointsAwarded: 0, message: "Loyalty points system is currently disabled." };
    }

    const eligibleAmount = Number(order.subtotal || order.total || 0);
    const pointsToAward = calculateEarnablePoints(eligibleAmount, settings);

    if (pointsToAward <= 0) {
      return { success: false, pointsAwarded: 0, message: "Order amount below minimum spend threshold for points." };
    }

    const nowIso = new Date().toISOString();
    let expiresAt: string | null = null;
    if (settings.expiryDays > 0) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + settings.expiryDays);
      expiresAt = expDate.toISOString();
    }

    // 2. Atomic Points Update & Ledger Entry
    let newBalance = pointsToAward;
    const accountRef = doc(db, "loyalty_points", userId);
    const accountSnap = await getDoc(accountRef);

    let lifetime = pointsToAward;
    let spent = 0;
    if (accountSnap.exists()) {
      const data = accountSnap.data();
      newBalance = Number(data.points || 0) + pointsToAward;
      lifetime = Number(data.lifetime_points || data.points || 0) + pointsToAward;
      spent = Number(data.points_spent || 0);
    }

    const tier = calculateTier(lifetime, settings);

    // Save updated loyalty account
    await setDoc(accountRef, {
      id: userId,
      user_id: userId,
      user_email: order.customer_email || "",
      user_name: order.customer_name || "",
      points: newBalance,
      lifetime_points: lifetime,
      points_spent: spent,
      tier,
      updated_at: nowIso
    }, { merge: true });

    // Insert immutable transaction ledger record
    const txId = `lp_earn_${orderId}_${Date.now()}`;
    const ledgerEntry: LoyaltyTransaction = {
      id: txId,
      user_id: userId,
      user_email: order.customer_email || "",
      points: pointsToAward,
      type: "order_delivered",
      order_id: orderId,
      order_number: order.order_number || orderId,
      order_amount: eligibleAmount,
      description: `অর্ডার #${order.order_number || orderId} ডেলিভারি উপলক্ষে অর্জিত পয়েন্ট (৳${eligibleAmount.toLocaleString()} কেনাকাটায়)`,
      balance_after: newBalance,
      idempotency_key: idempotencyKey,
      expires_at: expiresAt,
      created_at: nowIso
    };

    await setDoc(doc(db, "loyalty_history", txId), ledgerEntry);

    // Update local cache
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`durtup_loyalty_history_${userId}`) || "[]";
        const hist: LoyaltyTransaction[] = JSON.parse(raw);
        hist.unshift(ledgerEntry);
        localStorage.setItem(`durtup_loyalty_history_${userId}`, JSON.stringify(hist));
        localStorage.setItem(`durtup_loyalty_${userId}`, JSON.stringify({
          id: userId, user_id: userId, points: newBalance, lifetime_points: lifetime, tier, points_spent: spent
        }));
      } catch {}
    }

    // Trigger instant native push notification for customer
    sendLoyaltyEarnedNotification({
      userId,
      orderNumber: order.order_number || orderId,
      pointsEarned: pointsToAward,
      totalPoints: newBalance,
      tier,
      customerName: order.customer_name,
    }).catch(() => {});

    return {
      success: true,
      pointsAwarded: pointsToAward,
      message: `🎉 সফলভাবে ${pointsToAward} লয়্যালটি পয়েন্ট কাস্টমারের ওয়ালেটে যোগ করা হয়েছে!`
    };
  } catch (err: any) {
    console.error("[Loyalty] Error awarding delivery points:", err);
    return { success: false, pointsAwarded: 0, message: err.message || "Failed to award points" };
  }
}

/**
 * 7. Reconcile Loyalty Points on Order Cancel or Refund
 * Handles both:
 * A) Earned points reversal (if delivered order is refunded)
 * B) Redeemed points restoration (if cancelled order had points discount)
 */
export async function reconcileOrderPointsOnCancelOrRefund(order: {
  id: string;
  order_number?: string;
  user_id?: string;
  userId?: string;
  loyalty_points_redeemed?: number;
}): Promise<{ success: boolean; message: string }> {
  const userId = order.user_id || order.userId;
  if (!userId || userId === "guest") return { success: false, message: "Not applicable for guest order" };

  const orderId = String(order.id);
  const idempotencyKey = `order_reconciled_${orderId}`;

  try {
    // Check if already reconciled
    const recSnap = await getDocs(query(
      collection(db, "loyalty_history"),
      where("idempotency_key", "==", idempotencyKey)
    ));
    if (!recSnap.empty) {
      return { success: true, message: `Points already reconciled previously for order #${order.order_number || orderId}.` };
    }

    const nowIso = new Date().toISOString();
    const account = await getUserLoyaltyAccount(userId);
    let updatedPoints = account.points;
    const actionsTaken: string[] = [];

    // Case 1: If points were REDEEMED at checkout on this order, RESTORE them to user
    const redeemedPoints = Number(order.loyalty_points_redeemed || 0);
    if (redeemedPoints > 0) {
      updatedPoints += redeemedPoints;
      const refundTxId = `lp_ref_spent_${orderId}_${Date.now()}`;
      const refundLedger: LoyaltyTransaction = {
        id: refundTxId,
        user_id: userId,
        points: redeemedPoints,
        type: "order_refunded",
        order_id: orderId,
        order_number: order.order_number || orderId,
        description: `অর্ডার #${order.order_number || orderId} বাতিল/রিফান্ড হওয়ায় ব্যবহৃত ${redeemedPoints} পয়েন্ট ফেরত দেওয়া হয়েছে`,
        balance_after: updatedPoints,
        idempotency_key: idempotencyKey,
        created_at: nowIso
      };
      await setDoc(doc(db, "loyalty_history", refundTxId), refundLedger);
      actionsTaken.push(`${redeemedPoints} points refunded back to customer`);
    }

    // Case 2: If points were EARNED on this order (was delivered earlier), DEDUCT them back
    const earnQ = query(
      collection(db, "loyalty_history"),
      where("idempotency_key", "==", `order_delivered_${orderId}`)
    );
    const earnSnap = await getDocs(earnQ);
    if (!earnSnap.empty) {
      const earnedPoints = Number(earnSnap.docs[0].data().points || 0);
      if (earnedPoints > 0) {
        updatedPoints = Math.max(0, updatedPoints - earnedPoints);
        const deductTxId = `lp_ref_earned_${orderId}_${Date.now()}`;
        const deductLedger: LoyaltyTransaction = {
          id: deductTxId,
          user_id: userId,
          points: -earnedPoints,
          type: "order_refunded",
          order_id: orderId,
          order_number: order.order_number || orderId,
          description: `অর্ডার #${order.order_number || orderId} বাতিল/রিফান্ড হওয়ায় পূর্বে অর্জিত ${earnedPoints} পয়েন্ট সমন্বয় (কর্তন) করা হয়েছে`,
          balance_after: updatedPoints,
          idempotency_key: idempotencyKey + "_deduct",
          created_at: nowIso
        };
        await setDoc(doc(db, "loyalty_history", deductTxId), deductLedger);
        actionsTaken.push(`${earnedPoints} earned points reconciled`);
      }
    }

    if (actionsTaken.length > 0) {
      await setDoc(doc(db, "loyalty_points", userId), {
        points: updatedPoints,
        updated_at: nowIso
      }, { merge: true });
    }

    return {
      success: true,
      message: actionsTaken.length > 0 ? actionsTaken.join("; ") : "No points adjustments needed."
    };
  } catch (err: any) {
    console.error("[Loyalty] Error reconciling points:", err);
    return { success: false, message: err.message || "Failed to reconcile points" };
  }
}

/**
 * 8. Validate Points Redemption at Checkout
 * Server-side & Client-side validation to prevent client spoofing
 */
export async function validatePointsRedemption(
  userId: string,
  requestedPoints: number,
  orderSubtotal: number
): Promise<{
  valid: boolean;
  message?: string;
  pointsToUse: number;
  discountAmount: number;
}> {
  if (!userId || requestedPoints <= 0) {
    return { valid: false, message: "Invalid user or points", pointsToUse: 0, discountAmount: 0 };
  }

  const settings = await getLoyaltySettings();
  if (!settings.enabled) {
    return { valid: false, message: "Loyalty program is disabled", pointsToUse: 0, discountAmount: 0 };
  }

  const account = await getUserLoyaltyAccount(userId);
  if (account.points < settings.minPointsToRedeem) {
    return {
      valid: false,
      message: `পয়েন্ট ব্যবহার করতে সর্বনিম্ন ${settings.minPointsToRedeem} পয়েন্ট প্রয়োজন। আপনার আছে ${account.points} পয়েন্ট।`,
      pointsToUse: 0,
      discountAmount: 0
    };
  }

  // Cap at available points
  let points = Math.min(requestedPoints, account.points);
  let discount = Math.floor(points * (settings.pointValueInTaka || 0.50));

  // Cap at max allowable percentage of subtotal
  const maxDiscountAllowed = Math.floor(orderSubtotal * ((settings.maxPointsRedemptionPercent || 50) / 100));
  if (discount > maxDiscountAllowed) {
    discount = maxDiscountAllowed;
    points = Math.ceil(discount / (settings.pointValueInTaka || 0.50));
  }

  return {
    valid: discount > 0 && points > 0,
    pointsToUse: points,
    discountAmount: discount
  };
}

/**
 * 9. Deduct Points upon Checkout Order Placement
 */
export async function redeemPointsAtCheckout(
  userId: string,
  orderId: string,
  orderNumber: string,
  pointsToRedeem: number,
  discountAmount: number
): Promise<{ success: boolean; message: string }> {
  if (!userId || pointsToRedeem <= 0) return { success: false, message: "Invalid redemption" };

  const idempotencyKey = `checkout_redeemed_${orderId}`;

  try {
    // Check idempotency
    const existingQ = query(
      collection(db, "loyalty_history"),
      where("idempotency_key", "==", idempotencyKey)
    );
    const existingSnap = await getDocs(existingQ);
    if (!existingSnap.empty) {
      return { success: true, message: "Points already redeemed for this order." };
    }

    const nowIso = new Date().toISOString();
    const accountRef = doc(db, "loyalty_points", userId);
    const snap = await getDoc(accountRef);

    let currentPoints = 0;
    let spent = 0;
    if (snap.exists()) {
      const d = snap.data();
      currentPoints = Number(d.points || 0);
      spent = Number(d.points_spent || 0);
    }

    const newPoints = Math.max(0, currentPoints - pointsToRedeem);
    const newSpent = spent + pointsToRedeem;

    // Update account
    await setDoc(accountRef, {
      points: newPoints,
      points_spent: newSpent,
      updated_at: nowIso
    }, { merge: true });

    // Record ledger transaction
    const txId = `lp_spend_${orderId}_${Date.now()}`;
    const ledgerEntry: LoyaltyTransaction = {
      id: txId,
      user_id: userId,
      points: -pointsToRedeem,
      type: "checkout_redeemed",
      order_id: orderId,
      order_number: orderNumber,
      order_amount: discountAmount,
      description: `অর্ডার #${orderNumber} চেকআউটে ৳${discountAmount} ছাড় পেতে ${pointsToRedeem} পয়েন্ট ব্যবহার করা হয়েছে`,
      balance_after: newPoints,
      idempotency_key: idempotencyKey,
      created_at: nowIso
    };

    await setDoc(doc(db, "loyalty_history", txId), ledgerEntry);

    // Update local cache
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`durtup_loyalty_history_${userId}`) || "[]";
        const hist: LoyaltyTransaction[] = JSON.parse(raw);
        hist.unshift(ledgerEntry);
        localStorage.setItem(`durtup_loyalty_history_${userId}`, JSON.stringify(hist));
        localStorage.setItem(`durtup_loyalty_${userId}`, JSON.stringify({
          ...snap.data(), points: newPoints, points_spent: newSpent
        }));
      } catch {}
    }

    return { success: true, message: "Points successfully redeemed." };
  } catch (err: any) {
    console.error("[Loyalty] Error redeeming points at checkout:", err);
    return { success: false, message: err.message || "Failed to redeem points" };
  }
}

/**
 * 10. Admin: Award Bonus Points to a specific user
 */
export async function awardBonusPoints(
  userId: string,
  userEmail: string,
  points: number,
  reason: string,
  adminName: string = "Admin"
): Promise<{ success: boolean; newBalance: number; message: string }> {
  if (!userId || points <= 0) {
    throw new Error("Invalid user ID or points amount");
  }

  const nowIso = new Date().toISOString();
  const settings = await getLoyaltySettings();
  const accountRef = doc(db, "loyalty_points", userId);
  const snap = await getDoc(accountRef);

  let currentPoints = 0;
  let lifetime = 0;
  let spent = 0;

  if (snap.exists()) {
    const d = snap.data();
    currentPoints = Number(d.points || 0);
    lifetime = Number(d.lifetime_points || d.points || 0);
    spent = Number(d.points_spent || 0);
  }

  const newPoints = currentPoints + points;
  const newLifetime = lifetime + points;
  const tier = calculateTier(newLifetime, settings);

  await setDoc(accountRef, {
    id: userId,
    user_id: userId,
    user_email: userEmail || snap.data()?.user_email || "",
    points: newPoints,
    lifetime_points: newLifetime,
    points_spent: spent,
    tier,
    updated_at: nowIso
  }, { merge: true });

  const txId = `lp_bonus_${userId}_${Date.now()}`;
  const ledgerEntry: LoyaltyTransaction = {
    id: txId,
    user_id: userId,
    user_email: userEmail,
    points: points,
    type: "admin_bonus",
    description: `অ্যাডমিন বোনাস: ${reason} (কর্তৃক: ${adminName})`,
    balance_after: newPoints,
    idempotency_key: txId,
    created_at: nowIso
  };

  await setDoc(doc(db, "loyalty_history", txId), ledgerEntry);

  return {
    success: true,
    newBalance: newPoints,
    message: `সফলভাবে ${points} বোনাস পয়েন্ট ব্যবহারকারীকে প্রদান করা হয়েছে!`
  };
}

/**
 * 11. Admin: Fetch All Loyalty Members
 */
export async function getAllLoyaltyMembers(): Promise<LoyaltyAccount[]> {
  try {
    const snap = await getDocs(query(
      collection(db, "loyalty_points"),
      orderBy("lifetime_points", "desc"),
      fsLimit(100)
    ));
    const list: LoyaltyAccount[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) });
    });
    return list;
  } catch (err) {
    console.warn("[Loyalty] Error fetching all members:", err);
    return [];
  }
}

/**
 * 12. Admin: Fetch All Store Loyalty Transactions (Audit Log)
 */
export async function getAllLoyaltyHistory(limitCount: number = 50): Promise<LoyaltyTransaction[]> {
  try {
    const snap = await getDocs(query(
      collection(db, "loyalty_history"),
      orderBy("created_at", "desc"),
      fsLimit(limitCount)
    ));
    const list: LoyaltyTransaction[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) });
    });
    return list;
  } catch (err) {
    console.warn("[Loyalty] Error fetching store history:", err);
    return [];
  }
}
