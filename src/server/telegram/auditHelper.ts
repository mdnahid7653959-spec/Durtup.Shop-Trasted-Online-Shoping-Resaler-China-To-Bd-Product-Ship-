/**
 * src/server/telegram/auditHelper.ts
 * Central Telegram Audit Logger for Durtup.shop
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

export interface TelegramAuditEntry {
  telegramAdminId: number | string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  details?: string;
  timestamp?: string;
}

// In-memory circular buffer for fast query, Telegram /admin security inspection, and offline testing
const inMemoryAuditLogs: TelegramAuditEntry[] = [];
const MAX_IN_MEMORY_LOGS = 200;

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
    console.warn("[auditHelper] Firebase initialization warning:", err.message);
    return null;
  }
}

/**
 * Non-blocking dual-write audit log helper.
 * Persists to in-memory buffer, and asynchronously writes to Firestore
 * collections 'audit_logs' and 'admin_activity_logs' within a 2000ms race timeout.
 */
export async function recordTelegramAudit(entry: TelegramAuditEntry): Promise<void> {
  const ts = entry.timestamp || new Date().toISOString();
  const normalizedEntry: TelegramAuditEntry = {
    ...entry,
    telegramAdminId: String(entry.telegramAdminId),
    timestamp: ts
  };

  // 1. In-memory buffer dual write (instant retrieval, zero network latency)
  inMemoryAuditLogs.unshift(normalizedEntry);
  if (inMemoryAuditLogs.length > MAX_IN_MEMORY_LOGS) {
    inMemoryAuditLogs.pop();
  }

  // 2. Persist to Firestore with a 2,000ms race timeout (never blocks or throws)
  try {
    const firestorePromise = (async () => {
      const db = getDb();
      if (!db) return;

      // Primary: audit_logs collection (matches web admin audit log structure)
      const fullAuditDoc = {
        admin_id: String(entry.telegramAdminId),
        admin_name: entry.adminName || "Telegram Admin",
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        old_value: entry.oldValue ?? null,
        new_value: entry.newValue ?? null,
        details: entry.details || "",
        created_at: ts,
        source: "telegram_admin_bot"
      };
      await addDoc(collection(db, "audit_logs"), fullAuditDoc);

      // Secondary mirror: admin_activity_logs collection (for AdminSecurity.tsx)
      const activityDoc = {
        adminId: String(entry.telegramAdminId),
        adminEmail: `${entry.telegramAdminId}@telegram.durtup.shop`,
        adminRole: "telegram_admin",
        action: entry.action,
        module: entry.entityType,
        targetId: entry.entityId,
        status: "SUCCESS",
        details: entry.details || `${entry.action} on ${entry.entityType} ${entry.entityId}`,
        createdAt: ts
      };
      await addDoc(collection(db, "admin_activity_logs"), activityDoc);
    })();

    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
    await Promise.race([firestorePromise, timeoutPromise]);
  } catch (err: any) {
    console.warn("[auditHelper] Failed to persist audit log to Firestore (non-fatal):", err.message);
  }
}

/**
 * Returns recent in-memory audit logs.
 */
export function getRecentTelegramAuditLogs(limitCount = 50): TelegramAuditEntry[] {
  return inMemoryAuditLogs.slice(0, limitCount);
}

/**
 * Clears the in-memory audit log buffer (useful for test resets).
 */
export function clearInMemoryAuditLogs(): void {
  inMemoryAuditLogs.length = 0;
}
