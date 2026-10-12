import React from "react";
import { Link } from "react-router-dom";
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SigmaTrackingData } from "@/server/sigmaServerEngine";

interface SigmaOrderTrackingCardProps {
  data: SigmaTrackingData;
}

const STEPS = [
  { key: "pending", label: "অর্ডার গ্রহণ", desc: "Order Placed" },
  { key: "processing", label: "প্রক্রিয়াধীন", desc: "Processing" },
  { key: "shipped", label: "কুরিয়ারে হস্তান্তর", desc: "Shipped" },
  { key: "out_for_delivery", label: "ডেলিভারিতে বের হয়েছে", desc: "Out for Delivery" },
  { key: "delivered", label: "ডেলিভারি সম্পন্ন", desc: "Delivered" },
];

export const SigmaOrderTrackingCard: React.FC<SigmaOrderTrackingCardProps> = ({ data }) => {
  const currentStep = data.step || 2;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 shadow-sm my-2 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              লাইভ অর্ডার ট্র্যাকিং
            </h4>
            <p className="text-[10px] text-slate-500">Order #{data.orderNumber}</p>
          </div>
        </div>
        <Badge className="bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-bold">
          {data.statusBengali}
        </Badge>
      </div>

      {/* 5-Step Progress Timeline */}
      <div className="py-2">
        <div className="relative flex items-center justify-between">
          {/* Timeline background bar */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-slate-200 z-0" />
          {/* Active progress bar */}
          <div
            className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-orange-500 z-0 transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (STEPS.length - 1)) * 100))}%` }}
          />

          {STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-orange-500 text-white"
                      : isCurrent
                      ? "bg-orange-500 text-white ring-4 ring-orange-200 animate-pulse"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
                </div>
                <span
                  className={`text-[9px] sm:text-[10px] font-bold mt-1 text-center max-w-[60px] leading-tight ${
                    isCurrent ? "text-orange-600" : isCompleted ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipment & Recipient Information */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2 text-xs">
        <div className="flex justify-between items-center text-slate-700">
          <span className="text-slate-500 text-[11px]">প্রত্যাশিত ডেলিভারি:</span>
          <span className="font-bold text-orange-600">{data.estimatedDelivery || "১-৩ কার্যদিবস"}</span>
        </div>
        {data.trackingNumber && (
          <div className="flex justify-between items-center text-slate-700">
            <span className="text-slate-500 text-[11px]">কুরিয়ার ট্র্যাকিং নম্বর:</span>
            <span className="font-mono text-slate-900 font-bold">{data.trackingNumber}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-slate-700">
          <span className="text-slate-500 text-[11px]">ডেলিভারি ঠিকানা:</span>
          <span className="text-slate-800 font-medium">{data.address}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <Link to={`/track?orderId=${data.orderNumber}`} className="w-full">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 gap-1.5 rounded-xl shadow-2xs"
          >
            <span>বিস্তারিত ট্র্যাকিং পেজ দেখুন</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
