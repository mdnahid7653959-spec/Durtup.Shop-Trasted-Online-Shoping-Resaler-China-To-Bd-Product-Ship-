import { db, auth } from "@/integrations/firebase/client";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction,
  orderBy,
  limit
} from "firebase/firestore";

export interface ReferralSettings {
  enabled: boolean;
  referrerReward: number;
  newCustomerDiscount: number;
  minimumOrderAmount: number;
  rewardTrigger: string;
  maxDailyRewards: number;
  withdrawEnabled: boolean;
  minimumWithdrawAmount: number;
}

export const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = {
  enabled: true,
  referrerReward: 50,
  newCustomerDiscount: 30,
  minimumOrderAmount: 500,
  rewardTrigger: "delivered",
  maxDailyRewards: 10,
  withdrawEnabled: true,
  minimumWithdrawAmount: 500,
};

const SETTINGS_STORAGE_KEY = "durtup_referral_settings";

let cachedSettings: ReferralSettings | null = (() => {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
})();

let lastSettingsFetch = 0;

export function getReferralSettingsSync(): ReferralSettings {
  if (cachedSettings) return cachedSettings;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        cachedSettings = JSON.parse(raw);
        return cachedSettings!;
      }
    } catch {}
  }
  return DEFAULT_REFERRAL_SETTINGS;
}

export async function getReferralSettings(forceRefresh = false): Promise<ReferralSettings> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now - lastSettingsFetch < 60000) {
    return cachedSettings;
  }

  try {
    const sDoc = await getDoc(doc(db, "settings", "referral"));
    if (sDoc.exists()) {
      const d = sDoc.data();
      cachedSettings = {
        enabled: d.enabled !== false,
        referrerReward: Number(d.referrerReward) || 50,
        newCustomerDiscount: Number(d.newCustomerDiscount) || 30,
        minimumOrderAmount: Number(d.minimumOrderAmount) || 500,
        rewardTrigger: d.rewardTrigger || "delivered",
        maxDailyRewards: Number(d.maxDailyRewards) || 10,
        withdrawEnabled: d.withdrawEnabled !== false,
        minimumWithdrawAmount: Number(d.minimumWithdrawAmount) || 500,
      };
      lastSettingsFetch = now;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cachedSettings));
        } catch {}
      }
      return cachedSettings;
    }
  } catch (err) {
    console.warn("Failed fetching settings/referral:", err);
  }

  cachedSettings = cachedSettings || { ...DEFAULT_REFERRAL_SETTINGS };
  lastSettingsFetch = now;
  return cachedSettings;
}

export async function saveReferralSettings(settings: Partial<ReferralSettings>): Promise<void> {
  const current = await getReferralSettings(true);
  const updated = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, "settings", "referral"), updated, { merge: true });
  cachedSettings = updated;
  lastSettingsFetch = Date.now();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }
}

// -------------------------------------------------------------
// Unique Referral Code Generator
// -------------------------------------------------------------
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // readable, no 0/O or 1/I confusion

export function generateRandomCode(prefix = "DUR", length = 5): string {
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return result;
}

export async function generateUniqueReferralCode(customPrefix?: string): Promise<string> {
  const p = customPrefix ? `DUR${customPrefix.toUpperCase().slice(0, 3)}` : "DUR";
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRandomCode(p, 5);
    // Check collision in profiles
    const q = query(collection(db, "profiles"), where("referralCode", "==", code), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      // Also check case-insensitive field if stored as referral_code
      const q2 = query(collection(db, "profiles"), where("referral_code", "==", code), limit(1));
      const snap2 = await getDocs(q2);
      if (snap2.empty) {
        return code;
      }
    }
  }
  return `DUR${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

// -------------------------------------------------------------
// Attribution Tracking (30-day window, URL cleaning, safe storage)
// -------------------------------------------------------------
const ATTRIBUTION_STORAGE_KEY = "durtup_referral_attribution";
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface ReferralAttribution {
  referralCode: string;
  referrerId?: string;
  referrerName?: string;
  firstTrackedAt: string;
  lastTrackedAt: string;
}

export async function trackReferralAttribution(code: string): Promise<ReferralAttribution | null> {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode || !cleanCode.startsWith("DUR")) return null;

  try {
    // Check existing attribution
    const existing = getStoredAttribution();
    const nowIso = new Date().toISOString();

    // Look up referrer in Firestore
    let referrerId: string | undefined;
    let referrerName: string | undefined;

    let q = query(collection(db, "profiles"), where("referralCode", "==", cleanCode), limit(1));
    let snap = await getDocs(q);
    if (snap.empty) {
      q = query(collection(db, "profiles"), where("referral_code", "==", cleanCode), limit(1));
      snap = await getDocs(q);
    }

    if (!snap.empty) {
      const rDoc = snap.docs[0];
      referrerId = rDoc.id;
      referrerName = rDoc.data().full_name || rDoc.data().name || "Durtup Member";
    }

    // First-touch policy: if an active valid attribution already exists, keep its firstTrackedAt
    const attribution: ReferralAttribution = {
      referralCode: cleanCode,
      referrerId: referrerId || existing?.referrerId,
      referrerName: referrerName || existing?.referrerName,
      firstTrackedAt: existing ? existing.firstTrackedAt : nowIso,
      lastTrackedAt: nowIso
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
    }

    return attribution;
  } catch (err) {
    console.warn("Attribution tracking error:", err);
    return null;
  }
}

export function getStoredAttribution(): ReferralAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReferralAttribution;
    if (!parsed || !parsed.referralCode || !parsed.firstTrackedAt) return null;

    const age = Date.now() - new Date(parsed.firstTrackedAt).getTime();
    if (age > ATTRIBUTION_WINDOW_MS) {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredAttribution(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
  }
}

// -------------------------------------------------------------
// Profile Referral Initialization Hook
// -------------------------------------------------------------
export async function ensureUserReferralProfile(
  userId: string, 
  userEmail?: string | null, 
  userName?: string | null,
  existingProfileData?: any
): Promise<{ referralCode: string; referredBy: string | null }> {
  if (!userId) throw new Error("Missing userId");

  // If already present in provided profile data, skip network read
  if (existingProfileData && (existingProfileData.referralCode || existingProfileData.referral_code)) {
    const code = existingProfileData.referralCode || existingProfileData.referral_code;
    const refBy = existingProfileData.referredBy || existingProfileData.referred_by || null;
    return { referralCode: code, referredBy: refBy };
  }

  // Check local cache first
  if (typeof window !== "undefined") {
    try {
      const localKey = "durtup_profile_" + userId;
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.referralCode || parsed?.referral_code) {
          return {
            referralCode: parsed.referralCode || parsed.referral_code,
            referredBy: parsed.referredBy || parsed.referred_by || null,
          };
        }
      }
    } catch {}
  }

  const profileRef = doc(db, "profiles", userId);
  const snap = await getDoc(profileRef);
  const data = snap.exists() ? snap.data() : {};

  let referralCode = data.referralCode || data.referral_code;
  let referredBy = data.referredBy || data.referred_by || null;
  let needsUpdate = false;

  // 1. Generate referral code if not present
  if (!referralCode) {
    referralCode = await generateUniqueReferralCode();
    needsUpdate = true;
  }

  // 2. Link attribution if user has no referrer yet
  if (!referredBy) {
    const attr = getStoredAttribution();
    if (attr && attr.referralCode) {
      // Find referrer user ID
      let refId = attr.referrerId;
      if (!refId) {
        const rq = query(collection(db, "profiles"), where("referralCode", "==", attr.referralCode), limit(1));
        const rSnap = await getDocs(rq);
        if (!rSnap.empty) {
          refId = rSnap.docs[0].id;
        }
      }

      // Anti-fraud: cannot refer self
      if (refId && refId !== userId) {
        referredBy = refId;
        needsUpdate = true;
      }
    }
  }

  if (needsUpdate || !snap.exists()) {
    const nowIso = new Date().toISOString();
    const patch: any = {
      referralCode,
      referral_code: referralCode,
      wallet_balance: Number(data.wallet_balance || data.walletBalance || 0),
      walletBalance: Number(data.wallet_balance || data.walletBalance || 0),
      total_earned: Number(data.total_earned || data.totalEarned || 0),
      totalEarned: Number(data.total_earned || data.totalEarned || 0),
      successful_referrals: Number(data.successful_referrals || data.successfulReferrals || 0),
      successfulReferrals: Number(data.successful_referrals || data.successfulReferrals || 0),
      updated_at: nowIso
    };

    if (referredBy) {
      patch.referredBy = referredBy;
      patch.referred_by = referredBy;
    }

    if (userEmail && !data.email) patch.email = userEmail;
    if (userName && !data.full_name) patch.full_name = userName;

    await setDoc(profileRef, patch, { merge: true });

    // Update local cache
    try {
      const localKey = "durtup_profile_" + userId;
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const pObj = JSON.parse(raw);
        localStorage.setItem(localKey, JSON.stringify({ ...pObj, ...patch }));
      }
    } catch {}
  }

  return { referralCode, referredBy };
}

// -------------------------------------------------------------
// First Order Discount Eligibility Check
// -------------------------------------------------------------
export interface DiscountEligibilityResult {
  eligible: boolean;
  discountAmount: number;
  referralCode?: string;
  referrerId?: string;
  reason?: string;
}

export async function checkFirstOrderDiscountEligibility(
  userId: string | null, 
  subtotal: number
): Promise<DiscountEligibilityResult> {
  const settings = await getReferralSettings();
  if (!settings.enabled) {
    return { eligible: false, discountAmount: 0, reason: "Referral system paused" };
  }

  if (subtotal < settings.minimumOrderAmount) {
    return { 
      eligible: false, 
      discountAmount: 0, 
      reason: `Minimum order ৳${settings.minimumOrderAmount} required for referral reward` 
    };
  }

  let referrerId: string | undefined;
  let referralCode: string | undefined;

  // 1. Check logged-in user profile
  if (userId && !userId.startsWith("guest_")) {
    try {
      const pSnap = await getDoc(doc(db, "profiles", userId));
      if (pSnap.exists()) {
        const pData = pSnap.data();
        referrerId = pData.referredBy || pData.referred_by;
      }
    } catch {}
  }

  // 2. Check stored attribution
  const attr = getStoredAttribution();
  if (attr && attr.referralCode) {
    referralCode = attr.referralCode;
    if (!referrerId && attr.referrerId) {
      referrerId = attr.referrerId;
    }
  }

  if (!referrerId && !referralCode) {
    return { eligible: false, discountAmount: 0, reason: "No referral attribution" };
  }

  // If user is logged in, check if they have already placed a delivered/completed order
  if (userId && !userId.startsWith("guest_")) {
    try {
      const ordQuery = query(
        collection(db, "orders"), 
        where("user_id", "==", userId),
        where("status", "in", ["delivered", "confirmed", "processing", "shipped"])
      );
      const oSnap = await getDocs(ordQuery);
      if (!oSnap.empty) {
        return { eligible: false, discountAmount: 0, reason: "Applicable only on first order" };
      }
    } catch {}
  }

  return {
    eligible: true,
    discountAmount: settings.newCustomerDiscount,
    referralCode,
    referrerId
  };
}

// -------------------------------------------------------------
// Server-Side Operations Invoker
// -------------------------------------------------------------
async function postToReferralApi(action: string, payload: any) {
  // First attempt local /api/referral endpoint
  try {
    const res = await fetch("/api/referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload })
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server responded with ${res.status}`);
  } catch (err: any) {
    // If running in production or dev server middleware is not reachable, fallback to direct runTransaction client execution
    console.warn(`[ReferralAPI ${action} fallback to local execution]:`, err.message);
    const { handleReferralDevRequest } = await import("@/server/referralDevApi");
    return await handleReferralDevRequest(action, payload);
  }
}

export async function processOrderReferralReward(orderId: string, newStatus: string) {
  return await postToReferralApi("process-order-reward", { orderId, newStatus });
}

export async function requestWithdrawal(userId: string, amount: number, method: string, accountNumber: string) {
  return await postToReferralApi("request-withdrawal", { userId, amount, method, accountNumber });
}

export async function processWithdrawal(withdrawalId: string, status: "approved" | "rejected" | "paid", adminNote?: string, adminId?: string) {
  return await postToReferralApi("process-withdrawal", { withdrawalId, status, adminNote, adminId });
}

export async function manualAdjustment(userId: string, type: "credit" | "debit", amount: number, reason: string, adminId?: string) {
  return await postToReferralApi("manual-adjustment", { userId, type, amount, reason, adminId });
}
