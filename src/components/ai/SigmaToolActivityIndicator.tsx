import React from "react";
import { Loader2, Sparkles } from "lucide-react";

interface SigmaToolActivityIndicatorProps {
  activityText?: string;
}

export const SigmaToolActivityIndicator: React.FC<SigmaToolActivityIndicatorProps> = ({
  activityText = "Sigma কাজ সম্পন্ন করছে...",
}) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-600 dark:text-orange-400 text-xs font-bold animate-pulse shadow-sm my-1">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
      <span>{activityText}</span>
      <Sparkles className="h-3 w-3 text-orange-400 opacity-80" />
    </div>
  );
};
