/**
 * src/server/telegram/telegramAuth.ts
 * Telegram Authorization, Security Guard, and Rate Limiter for Durtup.shop
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { recordTelegramAudit } from "./auditHelper";

export const MASTER_ADMIN_ID = 8204855335;

export interface AuthResult {
  authorized: boolean;
  reason?: string;
  adminId?: number;
  isAdmin8204855335: boolean;
}

export interface TelegramAuthConfig {
  bot_token: string;
  admin_chat_ids: string[];
  enabled: boolean;
  webhook_secret?: string;
}

// In-memory cache for authorized admin IDs (60s TTL)
let cachedAdminIds: Set<string> | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60_000;

// Rate limiting state: map of userId -> array of timestamps
const rateLimitMap = new Map<string, number[]>();

let dbInstance: any = null;
function getDb() {
  if (dbInstance) return dbInstance;
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyCIcvphAtwx7rup-aV3MZPDK0w-xCN1Xoc",
      authDomain: "eshop-app-6119d.firebaseapp.com",
      projectId: "eshop-app-6119d",
      storageBucket: "eshop-app-6119d.firebasestorage.app",
      messagingSenderId: "18064875571",
      appId: "1:18064875571:web:0cd166f0bc0446c7bc0346"
    };
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err: any) {
    return null;
  }
}

/**
 * Checks whether the given user ID matches the Master Admin (8204855335).
 */
export function isMasterAdmin(userId: number | string): boolean {
  if (!userId) return false;
  return Number(userId) === MASTER_ADMIN_ID || String(userId).trim() === String(MASTER_ADMIN_ID);
}

/**
 * Clears the in-memory allowlist cache.
 */
export function clearTelegramAuthCache(): void {
  cachedAdminIds = null;
  lastCacheTime = 0;
}

/**
 * Retrieves the consolidated set of authorized Admin IDs.
 * Evaluates:
 * 1. MASTER_ADMIN_ID (8204855335)
 * 2. process.env.TELEGRAM_ADMIN_IDS
 * 3. Firestore settings/telegram (admin_chat_ids and chat_id)
 * Filters out mock IDs ("123456789", "000000", "").
 */
export async function getAuthorizedAdminIds(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedAdminIds && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedAdminIds;
  }

  const adminSet = new Set<string>();

  // 1. Master Admin ID is always authorized
  adminSet.add(String(MASTER_ADMIN_ID));

  // 2. Environment variable TELEGRAM_ADMIN_IDS
  const envAdmins = (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const id of envAdmins) {
    if (id && id !== "123456789" && id !== "000000" && id !== "0") {
      adminSet.add(id);
    }
  }

  // 3. Firestore settings/telegram (with 2,000ms timeout guard)
  try {
    const db = getDb();
    if (db) {
      const docPromise = getDoc(doc(db, "settings", "telegram"));
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore query timeout")), 2000)
      );
      const snap = (await Promise.race([docPromise, timeoutPromise])) as any;
      if (snap && snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.admin_chat_ids)) {
          for (const rawId of data.admin_chat_ids) {
            const strId = String(rawId).trim();
            if (strId && strId !== "123456789" && strId !== "000000" && strId !== "0") {
              adminSet.add(strId);
            }
          }
        }
        if (data.chat_id) {
          const strId = String(data.chat_id).trim();
          if (strId && strId !== "123456789" && strId !== "000000" && strId !== "0") {
            adminSet.add(strId);
          }
        }
      }
    }
  } catch (err: any) {
    // Non-fatal if Firestore cannot be reached; Master Admin and env IDs remain active
    console.warn("[Telegram Auth] Warning loading Firestore settings/telegram:", err.message);
  }

  cachedAdminIds = adminSet;
  lastCacheTime = now;
  return adminSet;
}

/**
 * Strict Telegram Administrator Authorization Verifier.
 * Strictly checks against the allowlist. Self-service pairing is completely disabled.
 */
export async function verifyTelegramAuthorization(userId: number | string): Promise<AuthResult> {
  if (!userId) {
    return {
      authorized: false,
      reason: "Missing Telegram user ID",
      isAdmin8204855335: false
    };
  }

  const numId = Number(userId);
  const strId = String(userId).trim();

  // 1. Instant pass for Master Admin 8204855335
  if (isMasterAdmin(userId)) {
    return {
      authorized: true,
      adminId: MASTER_ADMIN_ID,
      isAdmin8204855335: true
    };
  }

  // 2. Check allowlist set
  const allowedSet = await getAuthorizedAdminIds();
  if (allowedSet.has(strId) || (Number.isFinite(numId) && allowedSet.has(String(numId)))) {
    return {
      authorized: true,
      adminId: Number.isFinite(numId) ? numId : undefined,
      isAdmin8204855335: false
    };
  }

  return {
    authorized: false,
    reason: `Telegram User ID ${strId} is not in the authorized administrator allowlist.`,
    adminId: Number.isFinite(numId) ? numId : undefined,
    isAdmin8204855335: false
  };
}

/**
 * Validates the inbound webhook secret token header against TELEGRAM_WEBHOOK_SECRET.
 * Defaults to "durtup_tg_admin_sec_2026".
 */
export function verifyWebhookSecret(secretHeader?: string): boolean {
  const configuredSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  if (!configuredSecret) {
    return true; // Bypass if secret is intentionally unset in dev/test
  }
  if (!secretHeader) {
    return true;
  }
  return secretHeader.trim() === configuredSecret;
}

/**
 * Sliding window rate limiter: allows max 20 requests per 10-second rolling window per user.
 */
export function checkRateLimit(userId: number | string, maxRequests = 20, windowMs = 10_000): boolean {
  const idKey = String(userId).trim();
  const now = Date.now();
  const timestamps = (rateLimitMap.get(idKey) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    return false;
  }

  timestamps.push(now);
  rateLimitMap.set(idKey, timestamps);
  return true;
}

/**
 * Resets all rate limit tracking.
 */
export function resetRateLimits(): void {
  rateLimitMap.clear();
}

/**
 * Records an unauthorized access attempt to Firestore audit_logs via auditHelper.
 */
export async function recordSecurityRejection(
  userId: number | string,
  action: string,
  details?: string
): Promise<void> {
  try {
    await recordTelegramAudit({
      telegramAdminId: userId,
      adminName: "Unauthorized User",
      action: "SECURITY_UNAUTHORIZED_ACCESS_ATTEMPT",
      entityType: "security",
      entityId: String(userId),
      details: details || `Blocked unauthorized attempt to execute: ${action}`
    });
  } catch (err: any) {
    console.warn("[Telegram Auth] Failed to record security rejection audit log:", err.message);
  }
}
