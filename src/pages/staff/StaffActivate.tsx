import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, CheckCircle } from "lucide-react";
import { db, auth } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from "firebase/auth";

export default function StaffActivate() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);
  const [info, setInfo] = useState<{ id: string; email: string; full_name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) {
        setError("অ্যাক্টিভেশন টোকেন পাওয়া যায়নি বা লিংকটি ভুল।");
        setChecking(false);
        return;
      }

      try {
        // 1. Check in Firestore staff_members
        let found: any = null;
        try {
          const q = query(collection(db, "staff_members"), where("activation_token", "==", token));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0].data();
            found = { id: snap.docs[0].id, email: d.email, full_name: d.full_name };
          }
        } catch (e) {
          console.warn("Firestore token query:", e);
        }

        // 2. Check in LocalStorage cache if not found
        if (!found) {
          try {
            const raw = localStorage.getItem("durtup_staff_members");
            if (raw) {
              const list = JSON.parse(raw);
              const match = list.find((s: any) => s.activation_token === token);
              if (match) {
                found = { id: match.id, email: match.email, full_name: match.full_name };
              }
            }
          } catch {}
        }

        if (found) {
          setInfo(found);
        } else {
          setError("এই অ্যাক্টিভেশন লিংকটি অকার্যকর বা ইতিমধ্যে ব্যবহার করা হয়েছে।");
        }
      } catch (err: any) {
        setError(err.message || "টোকেন যাচাইকরণে সমস্যা হয়েছে।");
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!info) return;
    if (password.length < 6) {
      toast({ title: "পাসওয়ার্ড ছোট", description: "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "পাসওয়ার্ড মিলেনি", description: "উভয় ফিল্ডে একই পাসওয়ার্ড দিন।", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const nowIso = new Date().toISOString();

    try {
      // 1. Update staff record in Firestore
      try {
        await setDoc(doc(db, "staff_members", info.id), {
          status: "active",
          activation_token: null,
          updated_at: nowIso,
        }, { merge: true });
      } catch (e) {
        console.warn("Firestore staff activation update:", e);
      }

      // 2. Update localStorage cache
      try {
        const raw = localStorage.getItem("durtup_staff_members");
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map((s: any) => s.id === info.id ? { ...s, status: "active", activation_token: null, updated_at: nowIso } : s);
          localStorage.setItem("durtup_staff_members", JSON.stringify(updated));
        }
      } catch {}

      // 3. Register or sign-in in Firebase Auth
      try {
        await createUserWithEmailAndPassword(auth, info.email, password);
      } catch (authErr: any) {
        if (authErr.code === "auth/email-already-in-use") {
          try {
            await signInWithEmailAndPassword(auth, info.email, password);
          } catch {
            if (auth.currentUser && auth.currentUser.email === info.email) {
              await updatePassword(auth.currentUser, password);
            }
          }
        }
      }

      setActivated(true);
      toast({ title: "একাউন্ট সক্রিয় হয়েছে!", description: "স্টাফ একাউন্ট সফলভাবে সক্রিয় করা হয়েছে।" });
      setTimeout(() => {
        nav("/admin/staff", { replace: true });
      }, 1500);
    } catch (err: any) {
      toast({ title: "ব্যর্থ হয়েছে", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/40 p-4">
      <Card className="w-full max-w-md p-6 md:p-8 space-y-6 shadow-xl border-primary/20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {activated ? <CheckCircle className="h-6 w-6 text-emerald-500" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold">
            {activated ? "অভিনন্দন! একাউন্ট প্রস্তুত" : "স্টাফ একাউন্ট সক্রিয়করণ"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Durtup.shop Operations Team</p>
        </div>

        {error ? (
          <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
            {error}
          </div>
        ) : activated ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">আপনার একাউন্ট সফলভাবে সক্রিয় হয়েছে। ড্যাশবোর্ডে প্রবেশ করানো হচ্ছে...</p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="text-sm bg-muted/60 p-3 rounded-lg border space-y-1">
              <p><span className="text-muted-foreground">নাম:</span> <b>{info?.full_name}</b></p>
              <p><span className="text-muted-foreground">ইমেইল:</span> <b>{info?.email}</b></p>
            </div>
            <div>
              <Label>নতুন পাসওয়ার্ড (New Password)</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
              />
            </div>
            <div>
              <Label>পাসওয়ার্ড নিশ্চিত করুন (Confirm Password)</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="পুনরায় পাসওয়ার্ড লিখুন"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              একাউন্ট সক্রিয় করুন ও লগইন করুন
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
