import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Truck, Clock, Check, Loader2 } from "lucide-react";

export interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export function CustomerAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = "অর্ডার সম্পন্ন করতে সাইন ইন করুন",
  description = "আপনার ডেলিভারি তথ্য ও অর্ডার হিস্ট্রি নিরাপদে সংরক্ষণের জন্য একাউন্ট প্রয়োজন।"
}: CustomerAuthModalProps) {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Strict 12-second timeout so Google popup never hangs indefinitely on mobile
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("সাইন ইন সময় শেষ হয়ে গেছে। আবার চেষ্টা করুন বা সরাসরি অর্ডার করুন।")), 12000)
      );
      await Promise.race([signInWithGoogle(), timeoutPromise]);
      toast({
        title: "স্বাগতম",
        description: "সফলভাবে সাইন ইন সম্পন্ন হয়েছে।"
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      if (error?.code === "auth/popup-closed-by-user") {
        return;
      }
      const isUnauthDomain = error?.code === "auth/unauthorized-domain" || error?.message?.includes("unauthorized-domain");
      toast({
        variant: "destructive",
        title: "সাইন ইন সম্পন্ন হয়নি",
        description: isUnauthDomain
          ? "Domain authorization issue. Please contact support or use direct order."
          : error.message || "গুগল সাইন ইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[400px] w-[92vw] max-w-[400px] mx-auto rounded-2xl p-6 bg-card border border-border/80 shadow-xl">
        <DialogHeader className="text-center sm:text-center space-y-3">
          {/* Brand Signature Badge */}
          <div className="mx-auto flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/15 flex items-center justify-center text-orange-600 dark:text-orange-500 border border-orange-500/20">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-base font-bold text-orange-600 tracking-tight">Durtup</span>
              <span className="text-base font-semibold text-foreground">.shop</span>
            </div>
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-[320px] mx-auto">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Quiet Reassurance List - Unslopped & Cohesive */}
        <div className="my-4 p-3.5 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/60 space-y-2.5">
          <div className="flex items-start gap-2.5 text-xs text-foreground/90 leading-tight">
            <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center text-orange-600 dark:text-orange-500">
              <Truck className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
            <span>লাইভ অর্ডার ট্র্যাকিং ও দ্রুত ডেলিভারি আপডেট</span>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-foreground/90 leading-tight">
            <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center text-orange-600 dark:text-orange-500">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
            <span>ঠিকানা অটো-সেভ — পরবর্তী অর্ডারে দ্রুত চেকআউট</span>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-foreground/90 leading-tight">
            <div className="w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center text-orange-600 dark:text-orange-500">
              <Check className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
            <span>১০০% নিরাপদ ও সুরক্ষিত গুগল অথেন্টিকেশন</span>
          </div>
        </div>

        {/* Primary and Secondary Actions */}
        <div className="space-y-2 pt-1">
          <Button
            type="button"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-11 text-sm font-medium bg-background hover:bg-muted/40 text-foreground border border-input shadow-xs rounded-xl flex items-center justify-center gap-3 transition-colors active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                <span className="text-muted-foreground">সাইন ইন হচ্ছে...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
              if (onSuccess) onSuccess();
            }}
            disabled={loading}
            className="w-full h-10 text-xs font-semibold border-orange-500/30 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-xl transition-colors"
          >
            মোবাইল নম্বর ও নাম দিয়ে সরাসরি অর্ডার করুন
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full h-8 text-xs font-normal text-muted-foreground hover:text-foreground rounded-lg"
          >
            পরে করব / ব্রাউজিং চালিয়ে যান
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
