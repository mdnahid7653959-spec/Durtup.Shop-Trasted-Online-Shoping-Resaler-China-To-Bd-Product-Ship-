import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { 
  staffAdmin, 
  DEFAULT_DEPARTMENTS, 
  DEFAULT_ROLES, 
  getGmailComposeUrl 
} from "@/lib/staffAdmin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { PERMISSION_CATALOG } from "@/lib/staffPermissions";
import { logAdminActivity } from "@/services/auditLogger";
import { 
  Plus, 
  Loader2, 
  Send, 
  Copy, 
  MailPlus, 
  Ban, 
  RotateCcw, 
  ClipboardList, 
  Mail, 
  CheckCircle, 
  ExternalLink 
} from "lucide-react";

export default function AdminStaff() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [taskFor, setTaskFor] = useState<any | null>(null);
  const [msgFor, setMsgFor] = useState<any | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastStaffInfo, setLastStaffInfo] = useState<{ email: string; name?: string; role?: string; dept?: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, r, d] = await Promise.all([
        staffAdmin({ action: "list_staff" }),
        staffAdmin({ action: "list_roles" }),
        staffAdmin({ action: "list_departments" }),
      ]);
      setStaff(s?.data || []);
      setRoles(r?.data && Array.isArray(r.data) && r.data.length > 0 ? r.data : DEFAULT_ROLES);
      setDepts(d?.data && Array.isArray(d.data) && d.data.length > 0 ? d.data : DEFAULT_DEPARTMENTS);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e.message, variant: "destructive" });
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout title="Staff Management">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Create staff accounts, assign roles, permissions, tasks, and dispatch invitations.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> Invite Staff
        </Button>
      </div>

      {lastInviteUrl && (
        <Card className="p-4 mb-4 bg-emerald-500/5 border-emerald-500/30 shadow-sm animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 py-0.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Invitation Dispatched
                </Badge>
                {lastStaffInfo?.email && (
                  <span className="text-xs text-muted-foreground">
                    Sent to: <b className="text-foreground">{lastStaffInfo.email}</b>
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold">Staff Activation Link</p>
              <p className="text-xs text-muted-foreground font-mono break-all bg-background/90 p-2.5 rounded-md border mt-1 select-all">
                {lastInviteUrl}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => { 
                  navigator.clipboard.writeText(lastInviteUrl); 
                  toast({ title: "Link Copied", description: "Activation link copied to clipboard." }); 
                }}
              >
                <Copy className="h-4 w-4 mr-1.5" /> Copy Link
              </Button>
              {lastStaffInfo?.email && (
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                  onClick={() => {
                    const url = getGmailComposeUrl(
                      lastStaffInfo.email,
                      lastStaffInfo.name,
                      lastStaffInfo.role,
                      lastStaffInfo.dept,
                      lastInviteUrl
                    );
                    window.open(url, "_blank");
                  }}
                >
                  <Mail className="h-4 w-4 mr-1.5" /> Open in Gmail
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => window.open(lastInviteUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" /> Open Page
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
      ) : (
        <Card className="p-0 overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/70 text-muted-foreground">
              <tr className="text-left border-b">
                <th className="p-3 font-semibold">Name & Email</th>
                <th className="p-3 font-semibold">Department</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="font-medium text-foreground">{s.full_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{s.email}</div>
                    {s.phone && <div className="text-[11px] text-muted-foreground">{s.phone}</div>}
                  </td>
                  <td className="p-3">{s.staff_departments?.name || "—"}</td>
                  <td className="p-3 font-medium">{s.staff_roles?.name || "—"}</td>
                  <td className="p-3">
                    <Badge variant={s.status === "active" ? "default" : s.status === "invited" ? "secondary" : "destructive"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5 flex-wrap items-center">
                      <Button size="sm" variant="outline" onClick={() => setEditing(s)}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => setTaskFor(s)}>
                        <ClipboardList className="h-3.5 w-3.5 mr-1" />Task
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setMsgFor(s)}>
                        <MailPlus className="h-3.5 w-3.5 mr-1" />Msg
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        title="Open Gmail with invitation letter"
                        onClick={() => {
                          const actLink = s.activation_token 
                            ? `${window.location.origin}/staff/activate?token=${s.activation_token}`
                            : `${window.location.origin}/staff/activate`;
                          const url = getGmailComposeUrl(
                            s.email,
                            s.full_name,
                            s.staff_roles?.name || "Staff Member",
                            s.staff_departments?.name || "Operations",
                            actLink
                          );
                          window.open(url, "_blank");
                        }}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" />Email
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Resend invitation email"
                        onClick={async () => {
                          try {
                            const r = await staffAdmin({ 
                              action: "resend_invite", 
                              staff_id: s.id, 
                              email: s.email, 
                              full_name: s.full_name, 
                              site_url: window.location.origin 
                            });
                            setLastInviteUrl(r.activationUrl);
                            setLastStaffInfo({
                              email: s.email,
                              name: s.full_name,
                              role: s.staff_roles?.name,
                              dept: s.staff_departments?.name,
                            });
                            toast({ 
                              title: "ইনভাইটেশন ইমেইল পুনরায় পাঠানো হয়েছে!", 
                              description: `${s.email} ঠিকানায় অ্যাক্টিভেশন লিংক পাঠানো হয়েছে।` 
                            });
                            load();
                          } catch (e: any) { 
                            toast({ title: "Failed", description: e.message, variant: "destructive" }); 
                          }
                        }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      {s.status === "active" ? (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={async () => {
                            await staffAdmin({ action: "set_status", staff_id: s.id, status: "suspended" });
                            logAdminActivity({
                              action: "update",
                              entity_type: "security",
                              entity_id: s.id,
                              entity_name: s.full_name || s.email,
                              details: `Suspended staff access for ${s.full_name} (${s.email})`,
                            });
                            toast({ title: "Suspended" }); 
                            load();
                          }}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      ) : s.status === "suspended" ? (
                        <Button 
                          size="sm" 
                          onClick={async () => {
                            await staffAdmin({ action: "set_status", staff_id: s.id, status: "active" });
                            logAdminActivity({
                              action: "update",
                              entity_type: "security",
                              entity_id: s.id,
                              entity_name: s.full_name || s.email,
                              details: `Reactivated staff access for ${s.full_name} (${s.email})`,
                            });
                            toast({ title: "Activated" }); 
                            load();
                          }}
                        >
                          Activate
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <p className="font-medium text-base mb-1">No staff members found.</p>
                    <p className="text-xs">Click "+ Invite Staff" button above to add the first team member.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <StaffFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        roles={roles}
        depts={depts}
        onSaved={(url: string, info: any, newStaff: any) => {
          if (url) setLastInviteUrl(url);
          if (info) setLastStaffInfo(info);
          if (newStaff) {
            setStaff((prev) => {
              const filtered = prev.filter((s) => s.id !== newStaff.id && s.email !== newStaff.email);
              return [newStaff, ...filtered];
            });
          }
          load();
        }}
      />
      {editing && (
        <StaffFormDialog
          open={!!editing}
          onOpenChange={(o: boolean) => !o && setEditing(null)}
          roles={roles}
          depts={depts}
          existing={editing}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      {taskFor && <TaskDialog staff={taskFor} onClose={() => setTaskFor(null)} />}
      {msgFor && <MessageDialog staff={msgFor} onClose={() => setMsgFor(null)} />}
    </AdminLayout>
  );
}

function StaffFormDialog({ open, onOpenChange, roles, depts, existing, onSaved }: any) {
  const effectiveDepts = (depts && Array.isArray(depts) && depts.length > 0) ? depts : DEFAULT_DEPARTMENTS;
  const effectiveRoles = (roles && Array.isArray(roles) && roles.length > 0) ? roles : DEFAULT_ROLES;

  const [form, setForm] = useState<any>(existing ? {
    full_name: existing.full_name || "",
    email: existing.email || "",
    phone: existing.phone || "",
    department_id: existing.department_id || "",
    role_id: existing.role_id || "",
    monthly_salary: existing.monthly_salary || 0,
    joining_date: existing.joining_date || "",
  } : {
    full_name: "",
    email: "",
    phone: "",
    department_id: "",
    role_id: "",
    monthly_salary: 0,
    joining_date: new Date().toISOString().split("T")[0],
  });
  const [perms, setPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        full_name: existing.full_name || "",
        email: existing.email || "",
        phone: existing.phone || "",
        department_id: existing.department_id || "",
        role_id: existing.role_id || "",
        monthly_salary: existing.monthly_salary || 0,
        joining_date: existing.joining_date || "",
      });
      (async () => {
        const { data } = await (await import("@/lib/firebaseAdapter")).supabase
          .from("staff_permissions").select("permission_key").eq("staff_id", existing.id);
        setPerms((data || []).map((p) => p.permission_key));
      })();
    } else {
      setForm({
        full_name: "",
        email: "",
        phone: "",
        department_id: "",
        role_id: "",
        monthly_salary: 0,
        joining_date: new Date().toISOString().split("T")[0],
      });
      setPerms([]);
    }
  }, [existing, open]);

  const filteredRoles = form.department_id
    ? effectiveRoles.filter((r: any) => !r.department_id || r.department_id === form.department_id)
    : effectiveRoles;

  const handleDepartmentChange = (deptId: string) => {
    setForm((prev: any) => {
      const currentRole = effectiveRoles.find((r: any) => r.id === prev.role_id);
      const isRoleStillValid = currentRole && (!currentRole.department_id || currentRole.department_id === deptId);
      return {
        ...prev,
        department_id: deptId,
        role_id: isRoleStillValid ? prev.role_id : "",
      };
    });
  };

  const handleRoleChange = (roleId: string) => {
    const chosenRole = effectiveRoles.find((r: any) => r.id === roleId);
    setForm((prev: any) => ({
      ...prev,
      role_id: roleId,
      department_id: (!prev.department_id && chosenRole?.department_id) ? chosenRole.department_id : prev.department_id,
    }));
  };

  const submit = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: "তথ্য অসম্পূর্ণ", description: "অনুগ্রহ করে নাম এবং ইমেইল প্রদান করুন।", variant: "destructive" });
      return;
    }
    if (!form.department_id || !form.role_id) {
      toast({ title: "তথ্য অসম্পূর্ণ", description: "অনুগ্রহ করে ডিপার্টমেন্ট এবং রোল সিলেক্ট করুন।", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (existing) {
        await staffAdmin({ action: "update_staff", staff_id: existing.id, updates: form, permissions: perms });
        toast({ title: "Staff updated" });
        onSaved();
      } else {
        const r = await staffAdmin({ 
          action: "create_staff", 
          ...form, 
          permissions: perms, 
          site_url: window.location.origin 
        });
        toast({ 
          title: "ইমেইল ইনভাইটেশন পাঠানো হয়েছে!", 
          description: `${form.email} ঠিকানায় অ্যাক্টিভেশন লিংক ও ইনভাইটেশন সফলভাবে পাঠানো হয়েছে।` 
        });
        const chosenRole = effectiveRoles.find((role: any) => role.id === form.role_id);
        const chosenDept = effectiveDepts.find((dept: any) => dept.id === form.department_id);
        onSaved(
          r.activationUrl, 
          {
            email: form.email,
            name: form.full_name,
            role: chosenRole?.name || "Staff",
            dept: chosenDept?.name || "Operations",
          }, 
          r.staff
        );
      }
      onOpenChange(false);
    } catch (e: any) { 
      toast({ title: "Failed", description: e.message, variant: "destructive" }); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-3 shrink-0 border-b">
          <DialogTitle className="text-xl">
            {existing ? "Edit Staff Member" : "Invite New Staff Member"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {existing 
              ? "Update role assignments and platform permissions." 
              : "Enter credentials to dispatch an official staff activation invitation."}
          </p>
        </DialogHeader>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <Label className="text-xs font-semibold">Full name</Label>
              <Input 
                value={form.full_name} 
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} 
                placeholder="e.g. Nahid Islam" 
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Email address</Label>
              <Input 
                type="email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                disabled={!!existing} 
                placeholder="e.g. nahid@gmail.com" 
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Phone number</Label>
              <Input 
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                placeholder="01XXXXXXXXX" 
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Department</Label>
              <div className="mt-1">
                <Select value={form.department_id || undefined} onValueChange={handleDepartmentChange}>
                  <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>
                    {effectiveDepts.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Role</Label>
              <div className="mt-1">
                <Select value={form.role_id || undefined} onValueChange={handleRoleChange}>
                  <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    {filteredRoles.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Monthly salary (৳)</Label>
              <Input 
                type="number" 
                value={form.monthly_salary} 
                onChange={(e) => setForm({ ...form, monthly_salary: parseFloat(e.target.value) || 0 })} 
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold">Joining date</Label>
              <Input 
                type="date" 
                value={form.joining_date} 
                onChange={(e) => setForm({ ...form, joining_date: e.target.value })} 
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block text-xs font-semibold">
              Extra permissions (on top of role defaults)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/20">
              {PERMISSION_CATALOG.map((g) => (
                <div key={g.group} className="col-span-full">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-2 border-b pb-1">
                    {g.group}
                  </p>
                  {g.permissions.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-xs py-1.5 cursor-pointer hover:bg-muted/40 px-1 rounded">
                      <Checkbox 
                        checked={perms.includes(p.key)} 
                        onCheckedChange={(c) => {
                          setPerms(c ? [...perms, p.key] : perms.filter((x) => x !== p.key));
                        }} 
                      />
                      <span>{p.label}</span>
                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">{p.key}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/40 border-t shrink-0 flex flex-row items-center justify-between sm:justify-between w-full gap-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
            <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">ইমেইলে অ্যাক্টিভেশন আমন্ত্রণ পাঠানো হবে।</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {existing ? "Save changes" : "Send invitation & Email"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDialog({ staff, onClose }: any) {
  const [form, setForm] = useState({ title: "", description: "", priority: "normal", due_date: "" });
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign task to {staff.full_name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving || !form.title} onClick={async () => {
            setSaving(true);
            try { 
              await staffAdmin({ action: "assign_task", staff_id: staff.id, ...form }); 
              toast({ title: "Task assigned" }); 
              onClose(); 
            } catch (e: any) { 
              toast({ title: "Failed", description: e.message, variant: "destructive" }); 
            } finally { 
              setSaving(false); 
            }
          }}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageDialog({ staff, onClose }: any) {
  const [form, setForm] = useState({ subject: "", body: "" });
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Message {staff.full_name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div><Label>Message</Label><Textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving || !form.subject} onClick={async () => {
            setSaving(true);
            try { 
              await staffAdmin({ action: "send_message", staff_id: staff.id, ...form }); 
              toast({ title: "Message sent" }); 
              onClose(); 
            } catch (e: any) { 
              toast({ title: "Failed", description: e.message, variant: "destructive" }); 
            } finally { 
              setSaving(false); 
            }
          }}><Send className="h-4 w-4 mr-2" />Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
