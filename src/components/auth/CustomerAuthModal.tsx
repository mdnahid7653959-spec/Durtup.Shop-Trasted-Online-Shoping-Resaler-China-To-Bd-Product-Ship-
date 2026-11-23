import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Truck, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

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
  description = "আপনার অর্ডারটি নিরাপদ রাখতে এবং দ্রুত ডেলিভারি নিশ্চিত করতে একটি একাউন্ট প্রয়োজন।"
}: CustomerAuthModalProps) {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "স্বাগতম! সফলভাবে সাইন ইন হয়েছে 🎉",
        description: "Welcome to Durtup.shop!"
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      // Ignore user-initiated popup closing
      if (error?.code === "auth/popup-closed-by-user") {
        return;
      }
      const isUnauthDomain = error?.code === "auth/unauthorized-domain" || error?.message?.includes("unauthorized-domain");
      toast({
        variant: "destructive",
        title: "সাইন ইন ব্যর্থ হয়েছে",
        description: isUnauthDomain
          ? "Domain authorization issue. Please contact support."
          : error.message || "Failed to sign in with Google."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md w-[92vw] max-w-md mx-auto rounded-2xl p-6 bg-card border-border shadow-2xl">
        <DialogHeader className="text-center sm:text-center space-y-2">
          {/* Durtup Brand Signature */}
          <div className="flex justify-center items-center gap-1 mb-1">
            <span className="text-2xl font-black text-orange-600 tracking-tight">Durtup</span>
            <span className="text-2xl font-bold text-foreground">.shop</span>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Value Proposition & Trust Badges */}
        <div className="my-4 p-3.5 rounded-xl bg-orange-500/5 dark:bg-orange-950/20 border border-orange-500/15 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-foreground/90">
            <Truck className="h-4 w-4 text-orange-600 shrink-0" />
            <span>লাইভ অর্ডার ট্র্যাকিং ও দ্রুত ডেলিভারি আপডেট</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-foreground/90">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>ঠিকানা অটো-সেভ — পরবর্তী অর্ডারে এক-ক্লিকে চেকআউট</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-foreground/90">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>এক্সক্লুসিভ রিওয়ার্ড পয়েন্ট ও ক্যাশব্যাক সুবিধা</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-foreground/90">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
            <span>১০০% নিরাপদ ও সুরক্ষিত গুগল ভেরিফিকেশন</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <Button
            type="button"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 text-sm sm:text-base font-bold bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white dark:border-slate-700 shadow-sm flex items-center justify-center gap-3 rounded-xl transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                <span>সাইন ইন হচ্ছে...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full h-10 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground rounded-xl"
          >
            পরে করব / ব্রাউজিং চালিয়ে যান (Cancel)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
