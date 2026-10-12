import React, { useState } from "react";
import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck, 
  Truck, 
  Clock, 
  Lock, 
  Loader2, 
  ArrowRight, 
  Tag, 
  Banknote 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SigmaOrderDraft } from "@/server/sigmaServerEngine";

interface SigmaOrderConfirmationCardProps {
  draft: SigmaOrderDraft;
  onConfirmOrder: (draftId: string, token: string, paymentMethod: string) => Promise<void>;
}

export const SigmaOrderConfirmationCard: React.FC<SigmaOrderConfirmationCardProps> = ({
  draft,
  onConfirmOrder,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<string>(draft.paymentMethod || "cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmOrder(draft.draftId, draft.confirmationToken, selectedPayment);
      setIsConfirmed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 shadow-sm my-2 text-center space-y-2">
        <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h4 className="font-extrabold text-sm text-emerald-800">অর্ডার সফলভাবে প্লেস হয়েছে! 🎉</h4>
        <p className="text-xs text-emerald-700">
          আপনার অর্ডারটি গ্রহণ করা হয়েছে এবং প্রসেসিংয়ের জন্য পাঠানো হয়েছে।
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 shadow-md my-2 space-y-3.5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              অর্ডার প্রিভিউ ও চূড়ান্ত কনফার্মেশন
            </h4>
            <p className="text-[10px] text-slate-500">Sigma AI Two-Phase Secure Draft</p>
          </div>
        </div>
        <Badge className="bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-bold flex items-center gap-1">
          <Lock className="h-2.5 w-2.5" /> 100% Verified
        </Badge>
      </div>

      {/* Delivery Address Summary */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold mb-1">
          <span className="flex items-center gap-1 text-slate-700">
            <MapPin className="h-3 w-3 text-orange-600" /> ডেলিভারি ঠিকানা
          </span>
          <span className="text-[10px] text-orange-600 font-normal">পরিবর্তন করতে চাইলে লিখুন</span>
        </div>
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <User className="h-3.5 w-3.5 text-slate-500" />
          <span>{draft.shippingInfo.firstName || "Customer"}</span>
          <span className="text-slate-300">|</span>
          <Phone className="h-3.5 w-3.5 text-slate-500" />
          <span>{draft.shippingInfo.phone || "017XXXXXXXX"}</span>
        </div>
        <p className="text-slate-600 pl-5 text-[11px] leading-relaxed">
          {draft.shippingInfo.address}, {draft.shippingInfo.city}
        </p>
      </div>

      {/* Ordered Products Itemization */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-600 block">অর্ডারকৃত পণ্যসমূহ:</span>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {draft.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs"
            >
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                className="h-9 w-9 object-cover rounded-lg shrink-0 border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-800 line-clamp-1 block">{item.name}</span>
                <span className="text-[10px] text-slate-500">পরিমাণ: {item.quantity}টি</span>
              </div>
              <span className="font-black text-orange-600 shrink-0">
                ৳{(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>সাবটোটাল</span>
          <span className="font-semibold text-slate-800">৳{draft.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-slate-500" /> ডেলিভারি চার্জ ({draft.shippingInfo.city})
          </span>
          <span className="font-semibold text-slate-800">৳{draft.shippingFee.toLocaleString()}</span>
        </div>
        {draft.discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" /> কুপন ডিসকাউন্ট {draft.couponCode ? `(${draft.couponCode})` : ""}
            </span>
            <span className="font-bold">-৳{draft.discount.toLocaleString()}</span>
          </div>
        )}
        <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
          <span className="font-bold text-slate-800">সর্বমোট (Grand Total)</span>
          <span className="text-base font-black text-orange-600">
            ৳{draft.grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Payment Selection Toggle */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-600 block">পেমেন্ট মেথড:</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedPayment("cod")}
            className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
              selectedPayment === "cod"
                ? "bg-orange-50/80 border-orange-500 text-orange-700 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-orange-600" />
              <span>ক্যাশ অন ডেলিভারি</span>
            </div>
            <span className="text-[10px] font-normal text-slate-500 block mt-0.5">পণ্য হাতে পেয়ে টাকা দিন</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPayment("bkash")}
            className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
              selectedPayment === "bkash"
                ? "bg-pink-50/80 border-pink-500 text-pink-700 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-pink-600 font-black text-xs">bKash</span>
              <span>বিকাশ পেমেন্ট</span>
            </div>
            <span className="text-[10px] font-normal text-slate-500 block mt-0.5">ডিজিটাল পেমেন্ট</span>
          </button>
        </div>
      </div>

      {/* Final Action Button */}
      <Button
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-sm h-11 rounded-xl shadow-md shadow-orange-500/25 gap-2 transition-all active:scale-98"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>অর্ডার যাচাই ও কনফার্ম করা হচ্ছে...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {selectedPayment === "cod"
                ? `Confirm Order — Cash on Delivery (৳${draft.grandTotal.toLocaleString()})`
                : `Proceed to Payment (৳${draft.grandTotal.toLocaleString()})`}
            </span>
          </>
        )}
      </Button>
    </div>
  );
};
