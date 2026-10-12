import { supabase } from "@/lib/firebaseAdapter";
import { adminDb } from "@/lib/adminDb";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { logAdminActivity } from "@/services/auditLogger";

const ADMIN_SESSION_KEY = "megamart_admin_session";

export interface StaffDepartment {
  id: string;
  name: string;
  description?: string;
}

export interface StaffRole {
  id: string;
  name: string;
  department_id?: string;
  description?: string;
}

export const DEFAULT_DEPARTMENTS: StaffDepartment[] = [
  { id: "dept_mgmt", name: "Management & Executive", description: "Executive administration and governance" },
  { id: "dept_ops", name: "Operations & Logistics", description: "Fulfillment, courier handling & shipping" },
  { id: "dept_inventory", name: "Inventory & Warehouse", description: "Stock management, suppliers & replenishment" },
  { id: "dept_support", name: "Customer Support", description: "Customer inquiries, reviews & return handling" },
  { id: "dept_finance", name: "Finance & Accounts", description: "Payouts, platform commission & transactions" },
  { id: "dept_marketing", name: "Marketing & Growth", description: "Campaigns, coupons, ads & affiliate growth" },
  { id: "dept_tech", name: "IT & System Administration", description: "Technical infrastructure, security & audits" },
];

export const DEFAULT_ROLES: StaffRole[] = [
  // Management
  { id: "role_admin", name: "Full Administrator (All Access)", department_id: "dept_mgmt", description: "Complete access across all 24 modules" },
  { id: "role_gen_manager", name: "General Manager", department_id: "dept_mgmt", description: "Strategic operations and staff oversight" },
  
  // Operations & Logistics
  { id: "role_ops_manager", name: "Operations Manager", department_id: "dept_ops", description: "Manage order processing, fulfillment and dispatch" },
  { id: "role_dispatch_coord", name: "Dispatch & Logistics Coordinator", department_id: "dept_ops", description: "Coordinate courier pickups and consignment delivery" },
  
  // Inventory & Warehouse
  { id: "role_warehouse_spec", name: "Inventory Specialist", department_id: "dept_inventory", description: "Manage stock levels, restocks and supplier mappings" },
  { id: "role_stock_supervisor", name: "Warehouse Supervisor", department_id: "dept_inventory", description: "Physical warehouse intake, bins and stock audits" },
  
  // Customer Support
  { id: "role_support_lead", name: "Support Team Lead", department_id: "dept_support", description: "Handle escalations, approve returns and moderate reviews" },
  { id: "role_support_agent", name: "Customer Care Agent", department_id: "dept_support", description: "Answer buyer inquiries, process tickets and messages" },
  { id: "role_dispute_specialist", name: "Dispute & Claims Specialist", department_id: "dept_support", description: "Resolve seller-buyer disputes and return claims" },
  
  // Finance & Accounts
  { id: "role_finance_officer", name: "Finance & Accounts Officer", department_id: "dept_finance", description: "Reconciliation, seller payouts, refunds and wallet management" },
  { id: "role_billing_exec", name: "Billing & Commission Executive", department_id: "dept_finance", description: "Invoice generation, tax handling and seller commissions" },
  
  // Marketing & Growth
  { id: "role_marketing_lead", name: "Marketing & Promo Lead", department_id: "dept_marketing", description: "Create promotional flash sales, banners, coupons and ads" },
  { id: "role_seo_specialist", name: "Content & SEO Specialist", department_id: "dept_marketing", description: "Optimize product listings, keywords and banner text" },
  
  // IT & Tech
  { id: "role_tech_admin", name: "System Administrator", department_id: "dept_tech", description: "Security audits, access control and technical settings" },
  { id: "role_devops_eng", name: "Platform & DevOps Engineer", department_id: "dept_tech", description: "Database health, backup verification and API performance" },
];

function getAdminToken(): string | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s?.token || null;
  } catch { return null; }
}

export async function staffAdmin<T = any>(body: any): Promise<T> {
  const token = getAdminToken();

  // Try edge function if available
  if (supabase?.functions?.invoke) {
    try {
      const { data, error } = await supabase.functions.invoke("staff-admin", {
        body,
        headers: token ? { "x-admin-token": token } : undefined,
      });
      if (!error && data && !(data as any)?.error) {
        return data as T;
      }
    } catch {
      // Fallback silently to client Firestore / DB
    }
  }

  const action = body?.action;

  // 1. LIST DEPARTMENTS
  if (action === "list_departments") {
    let deptList: StaffDepartment[] = [];
    try {
      const snap = await getDocs(collection(db, "staff_departments"));
      if (!snap.empty) {
        snap.forEach((d) => {
          const data = d.data();
          deptList.push({ id: d.id, name: data.name || d.id, description: data.description });
        });
      }
    } catch (e) {
      console.warn("Firestore departments read warning:", e);
    }

    if (deptList.length === 0) {
      const { data } = await adminDb.select("staff_departments");
      if (data && Array.isArray(data) && data.length > 0) {
        deptList = data;
      } else {
        deptList = DEFAULT_DEPARTMENTS;
        // Seed default departments asynchronously
        DEFAULT_DEPARTMENTS.forEach((dept) => {
          setDoc(doc(db, "staff_departments", dept.id), dept, { merge: true }).catch(() => {});
        });
      }
    }
    return { data: deptList } as any;
  }

  // 2. LIST ROLES
  if (action === "list_roles") {
    let roleList: StaffRole[] = [];
    try {
      const snap = await getDocs(collection(db, "staff_roles"));
      if (!snap.empty) {
        snap.forEach((d) => {
          const data = d.data();
          roleList.push({
            id: d.id,
            name: data.name || d.id,
            department_id: data.department_id,
            description: data.description,
          });
        });
      }
    } catch (e) {
      console.warn("Firestore roles read warning:", e);
    }

    if (roleList.length === 0) {
      const { data } = await adminDb.select("staff_roles");
      if (data && Array.isArray(data) && data.length > 0) {
        roleList = data;
      } else {
        roleList = DEFAULT_ROLES;
        // Seed default roles asynchronously
        DEFAULT_ROLES.forEach((role) => {
          setDoc(doc(db, "staff_roles", role.id), role, { merge: true }).catch(() => {});
        });
      }
    }
    return { data: roleList } as any;
  }

  // 3. LIST STAFF
  if (action === "list_staff") {
    const staffMap = new Map<string, any>();

    // Fetch from Firestore
    try {
      const snap = await getDocs(collection(db, "staff_members"));
      snap.forEach((d) => {
        staffMap.set(d.id, { id: d.id, ...d.data() });
      });
    } catch (e) {
      console.warn("Firestore staff read warning:", e);
    }

    // Fetch from adminDb
    try {
      const { data } = await adminDb.select("staff_members");
      if (data && Array.isArray(data)) {
        data.forEach((s: any) => {
          if (!staffMap.has(s.id)) {
            staffMap.set(s.id, s);
          }
        });
      }
    } catch (e) {}

    // Check localStorage cache
    try {
      const raw = localStorage.getItem("durtup_staff_members");
      if (raw) {
        const localList = JSON.parse(raw);
        if (Array.isArray(localList)) {
          localList.forEach((s: any) => {
            if (!staffMap.has(s.id)) {
              staffMap.set(s.id, s);
            }
          });
        }
      }
    } catch (e) {}

    // Populate joined department & role names
    const depts = DEFAULT_DEPARTMENTS;
    const roles = DEFAULT_ROLES;
    const fullList = Array.from(staffMap.values()).map((s: any) => {
      const d = depts.find((dept) => dept.id === s.department_id);
      const r = roles.find((role) => role.id === s.role_id);
      return {
        ...s,
        staff_departments: s.staff_departments || (d ? { name: d.name } : null),
        staff_roles: s.staff_roles || (r ? { name: r.name } : null),
      };
    });

    return { data: fullList } as any;
  }

  // 4. CREATE STAFF
  if (action === "create_staff") {
    const staffId = `staff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const activationToken = `act_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    const nowIso = new Date().toISOString();

    const depts = DEFAULT_DEPARTMENTS;
    const roles = DEFAULT_ROLES;
    const d = depts.find((dept) => dept.id === body.department_id);
    const r = roles.find((role) => role.id === body.role_id);

    const staffRecord = {
      id: staffId,
      full_name: (body.full_name || "").trim(),
      email: (body.email || "").trim().toLowerCase(),
      phone: (body.phone || "").trim(),
      department_id: body.department_id || "",
      role_id: body.role_id || "",
      monthly_salary: Number(body.monthly_salary || 0),
      joining_date: body.joining_date || nowIso.split("T")[0],
      status: "invited",
      activation_token: activationToken,
      created_at: nowIso,
      updated_at: nowIso,
      staff_departments: d ? { name: d.name } : null,
      staff_roles: r ? { name: r.name } : null,
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, "staff_members", staffId), staffRecord, { merge: true });
    } catch (e) {}

    // Save to adminDb
    try {
      await adminDb.insert("staff_members", staffRecord);
    } catch (e) {}

    // Save permissions if any
    if (Array.isArray(body.permissions) && body.permissions.length > 0) {
      for (const permKey of body.permissions) {
        try {
          await setDoc(doc(db, "staff_permissions", `${staffId}_${permKey}`), {
            staff_id: staffId,
            permission_key: permKey,
            created_at: nowIso,
          });
        } catch {}
      }
    }

    // Save to LocalStorage cache
    try {
      const raw = localStorage.getItem("durtup_staff_members");
      const list = raw ? JSON.parse(raw) : [];
      list.push(staffRecord);
      localStorage.setItem("durtup_staff_members", JSON.stringify(list));
    } catch {}

    const siteUrl = body.site_url || (typeof window !== "undefined" ? window.location.origin : "");
    const activationUrl = `${siteUrl}/staff/activate?token=${activationToken}`;

    // 1. Dispatch real Email via Firebase Auth
    let emailSent = false;
    let emailError: string | null = null;
    const recipientEmail = (body.email || "").trim().toLowerCase();

    try {
      const { auth } = await import("@/integrations/firebase/client");
      const { sendPasswordResetEmail, createUserWithEmailAndPassword } = await import("firebase/auth");
      
      try {
        await sendPasswordResetEmail(auth, recipientEmail);
        emailSent = true;
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          const tempPass = "Durtup#" + Math.random().toString(36).slice(2, 8) + "!";
          try {
            await createUserWithEmailAndPassword(auth, recipientEmail, tempPass);
            await sendPasswordResetEmail(auth, recipientEmail);
            emailSent = true;
          } catch (createErr: any) {
            emailError = createErr.message;
          }
        } else {
          emailError = err.message;
        }
      }
    } catch (e: any) {
      emailError = e.message;
    }

    // 2. Also dispatch via server API endpoint
    try {
      await fetch("/api/staff/send-invite-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recipientEmail,
          fullName: staffRecord.full_name,
          role: r?.name || "Staff Member",
          department: d?.name || "Operations",
          activationUrl,
        }),
      });
    } catch {}

    logAdminActivity({
      action: "create",
      entity_type: "security",
      entity_id: staffId,
      entity_name: staffRecord.full_name,
      details: `Invited new staff ${staffRecord.full_name} (${staffRecord.email}) as ${r?.name || 'Staff'} in ${d?.name || 'Department'}`,
    });

    return {
      success: true,
      staffId,
      activationUrl,
      staff: staffRecord,
      emailSent,
      emailError,
    } as any;
  }

  // 5. UPDATE STAFF
  if (action === "update_staff") {
    const staffId = body.staff_id;
    const nowIso = new Date().toISOString();
    const updates = { ...(body.updates || {}), updated_at: nowIso };

    try {
      await setDoc(doc(db, "staff_members", staffId), updates, { merge: true });
    } catch {}

    try {
      await adminDb.update("staff_members", updates, { id: staffId });
    } catch {}

    // Update LocalStorage
    try {
      const raw = localStorage.getItem("durtup_staff_members");
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map((s: any) => s.id === staffId ? { ...s, ...updates } : s);
        localStorage.setItem("durtup_staff_members", JSON.stringify(updated));
      }
    } catch {}

    // Update permissions
    if (Array.isArray(body.permissions)) {
      for (const permKey of body.permissions) {
        try {
          await setDoc(doc(db, "staff_permissions", `${staffId}_${permKey}`), {
            staff_id: staffId,
            permission_key: permKey,
            created_at: nowIso,
          });
        } catch {}
      }
    }

    return { success: true } as any;
  }

  // 6. SET STATUS
  if (action === "set_status") {
    const staffId = body.staff_id;
    const newStatus = body.status;
    const nowIso = new Date().toISOString();

    try {
      await setDoc(doc(db, "staff_members", staffId), { status: newStatus, updated_at: nowIso }, { merge: true });
    } catch {}

    try {
      await adminDb.update("staff_members", { status: newStatus, updated_at: nowIso }, { id: staffId });
    } catch {}

    try {
      const raw = localStorage.getItem("durtup_staff_members");
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map((s: any) => s.id === staffId ? { ...s, status: newStatus } : s);
        localStorage.setItem("durtup_staff_members", JSON.stringify(updated));
      }
    } catch {}

    return { success: true } as any;
  }

  // 7. RESEND INVITE
  if (action === "resend_invite") {
    const staffId = body.staff_id;
    const newToken = `act_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    const nowIso = new Date().toISOString();

    let staffEmail = body.email;
    let staffName = body.full_name;

    try {
      const snap = await getDocs(collection(db, "staff_members"));
      snap.forEach((d) => {
        if (d.id === staffId) {
          const dat = d.data();
          if (!staffEmail) staffEmail = dat.email;
          if (!staffName) staffName = dat.full_name;
        }
      });
    } catch {}

    try {
      await setDoc(doc(db, "staff_members", staffId), {
        activation_token: newToken,
        status: "invited",
        updated_at: nowIso,
      }, { merge: true });
    } catch {}

    const siteUrl = body.site_url || (typeof window !== "undefined" ? window.location.origin : "");
    const activationUrl = `${siteUrl}/staff/activate?token=${newToken}`;

    if (staffEmail) {
      try {
        const { auth } = await import("@/integrations/firebase/client");
        const { sendPasswordResetEmail } = await import("firebase/auth");
        await sendPasswordResetEmail(auth, staffEmail);
      } catch {}

      try {
        await fetch("/api/staff/send-invite-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: staffEmail,
            fullName: staffName || "Staff Member",
            role: "Staff Member",
            department: "Operations",
            activationUrl,
          }),
        });
      } catch {}
    }

    return { success: true, activationUrl, email: staffEmail } as any;
  }

  // 8. ASSIGN TASK
  if (action === "assign_task") {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();
    const taskData = {
      id: taskId,
      staff_id: body.staff_id,
      title: body.title,
      description: body.description || "",
      priority: body.priority || "normal",
      due_date: body.due_date || null,
      status: "pending",
      created_at: nowIso,
    };

    try {
      await setDoc(doc(db, "staff_tasks", taskId), taskData);
      await adminDb.insert("staff_tasks", taskData);
    } catch {}

    return { success: true, taskId } as any;
  }

  // 9. SEND MESSAGE
  if (action === "send_message") {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();
    const msgData = {
      id: msgId,
      staff_id: body.staff_id,
      subject: body.subject,
      body: body.body || "",
      read: false,
      created_at: nowIso,
    };

    try {
      await setDoc(doc(db, "staff_messages", msgId), msgData);
      await adminDb.insert("staff_messages", msgData);
    } catch {}

    return { success: true, msgId } as any;
  }

  return { data: null } as any;
}

export function getGmailComposeUrl(
  email: string,
  fullName?: string,
  roleName?: string,
  deptName?: string,
  activationUrl?: string
): string {
  const subject = encodeURIComponent(`Invitation to join Durtup.shop Operations Team - ${roleName || "Staff Member"}`);
  const body = encodeURIComponent(
`Hello ${fullName || "Colleague"},

You have been invited to join the official Durtup.shop Administration & Operations Team!

Your Staff Role Details:
------------------------------------------
• Role: ${roleName || "Staff Member"}
• Department: ${deptName || "Operations & Administration"}
• Access Level: Platform Operations Portal

To activate your staff account and set your password, please click the secure link below:
${activationUrl || "https://www.durtup.shop/staff/activate"}

If the link does not open directly, copy and paste it into your browser.

Welcome aboard!
Durtup.shop Management & Operations
https://www.durtup.shop`
  );
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
}

export function getMailtoUrl(
  email: string,
  fullName?: string,
  roleName?: string,
  deptName?: string,
  activationUrl?: string
): string {
  const subject = encodeURIComponent(`Invitation to join Durtup.shop - ${roleName || "Staff Member"}`);
  const body = encodeURIComponent(
`Hello ${fullName || "Colleague"},

You have been invited to join the Durtup.shop team as ${roleName || "Staff Member"} (${deptName || "Operations"}).

Activate your account here:
${activationUrl || "https://www.durtup.shop/staff/activate"}

Best regards,
Durtup.shop Team`
  );
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

