import React from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, CheckCircle2, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SigmaSupportTicketData } from "@/server/sigmaServerEngine";

interface SigmaSupportTicketCardProps {
  ticket: SigmaSupportTicketData;
}

export const SigmaSupportTicketCard: React.FC<SigmaSupportTicketCardProps> = ({ ticket }) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 shadow-sm my-2 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <LifeBuoy className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
              সাপোর্ট টিকিট তৈরি সম্পন্ন
            </h4>
            <p className="text-[10px] text-slate-500">Ticket #{ticket.ticketId}</p>
          </div>
        </div>
        <Badge className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold">
          Open
        </Badge>
      </div>

      {/* Ticket Details */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 text-xs">
        <div className="text-slate-500 font-semibold text-[11px]">বিষয় / Subject:</div>
        <div className="text-slate-900 font-bold">{ticket.subject}</div>
        <div className="text-slate-500 text-[11px] mt-2 font-semibold">মেসেজ সারসংক্ষেপ:</div>
        <p className="text-slate-700 text-[11px] leading-relaxed bg-white p-2 rounded-lg border border-slate-200">
          {ticket.message}
        </p>
      </div>

      {/* Escalation Reassurance */}
      <p className="text-[11px] text-slate-600 leading-relaxed">
        আমাদের কাস্টমার কেয়ার টিম আপনার বিষয়টি পর্যালোচনা করছে এবং খুব দ্রুত আপনার সাথে যোগাযোগ করবে।
      </p>

      {/* Action */}
      <Link to="/help" className="block pt-1">
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 gap-1.5 rounded-xl shadow-2xs"
        >
          <span>হেল্প সেন্টার পেজ দেখুন</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
};
