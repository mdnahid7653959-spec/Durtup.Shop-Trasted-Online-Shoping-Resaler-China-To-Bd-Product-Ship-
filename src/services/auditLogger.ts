import { supabase } from "@/lib/firebaseAdapter";
import { db } from "@/integrations/firebase/client";
import { collection, addDoc, getDocs, query, orderBy, limit, where } from "firebase/firestore";

export interface AuditLogEntry {
  id?: string;
  admin_id: string;
  admin_name: string;
  action: string;
  entity_type: "product" | "order" | "inventory" | "price" | "customer" | "supplier" | "coupon" | "refund" | "wallet" | "cms" | "seo" | "ads" | "setting" | "security";
  entity_id: string;
  entity_name?: string;
  old_value?: any;
  new_value?: any;
  details?: string;
  ip_address?: string;
  created_at: string;
}

const LOCAL_AUDIT_LOGS_KEY = "durtup_admin_audit_logs";

export async function logAdminActivity(entry: Omit<AuditLogEntry, "created_at" | "admin_id" | "admin_name"> & {
  admin_id?: string;
  admin_name?: string;
}): Promise<void> {
  try {
    let adminId = entry.admin_id || "admin";
    let adminName = entry.admin_name || "Admin Staff";

    try {
      const rawSession = localStorage.getItem("megamart_admin_session");
      if (rawSession) {
        const session = JSON.parse(rawSession);
        if (session?.admin) {
          adminId = session.admin.id || session.admin.username || adminId;
          adminName = session.admin.displayName || session.admin.username || adminName;
        }
      }
    } catch {}

    const fullEntry: AuditLogEntry = {
      ...entry,
      admin_id: adminId,
      admin_name: adminName,
      created_at: new Date().toISOString(),
    };

    // 1. Write to Firestore audit_logs collection
    try {
      if (db) {
        const colRef = collection(db, "audit_logs");
        await addDoc(colRef, fullEntry);
      } else {
        await supabase.from("audit_logs").insert([fullEntry]);
      }
    } catch (dbErr) {
      console.warn("Failed to write audit log to Firestore, falling back to local storage:", dbErr);
    }

    // 2. Also cache locally in localStorage for instant retrieval & offline resilience
    try {
      const rawLocal = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
      const list: AuditLogEntry[] = rawLocal ? JSON.parse(rawLocal) : [];
      list.unshift({ ...fullEntry, id: `local-log-${Date.now()}-${Math.floor(Math.random() * 1000)}` });
      // Keep most recent 500 logs locally
      localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(list.slice(0, 500)));
    } catch (lsErr) {
      console.warn("Failed to cache audit log locally:", lsErr);
    }
  } catch (err) {
    console.error("Critical error in logAdminActivity:", err);
  }
}

export async function getAuditLogs(options?: {
  entity_type?: string;
  limitCount?: number;
}): Promise<AuditLogEntry[]> {
  const limitCount = options?.limitCount || 100;
  const logsMap = new Map<string, AuditLogEntry>();

  // 1. Fetch from Firestore
  try {
    if (db) {
      const colRef = collection(db, "audit_logs");
      let q = query(colRef, orderBy("created_at", "desc"), limit(limitCount));
      if (options?.entity_type && options.entity_type !== "all") {
        q = query(colRef, where("entity_type", "==", options.entity_type), orderBy("created_at", "desc"), limit(limitCount));
      }
      const snapshot = await getDocs(q);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AuditLogEntry;
        const id = docSnap.id;
        logsMap.set(id, { ...data, id });
      });
    }
  } catch (e) {
    console.warn("Firestore audit_logs fetch failed:", e);
  }

  // 2. Supplement with local audit logs
  try {
    const rawLocal = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
    if (rawLocal) {
      const localList: AuditLogEntry[] = JSON.parse(rawLocal);
      localList.forEach((log) => {
        const id = log.id || `${log.created_at}-${log.entity_id}`;
        if (!logsMap.has(id)) {
          if (!options?.entity_type || options.entity_type === "all" || log.entity_type === options.entity_type) {
            logsMap.set(id, log);
          }
        }
      });
    }
  } catch (e) {}

  const sorted = Array.from(logsMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return sorted.slice(0, limitCount);
}
