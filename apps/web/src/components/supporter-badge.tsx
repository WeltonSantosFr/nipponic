"use client";

import { Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SupporterBadgeProps {
  isSupporter?: boolean;
  isActiveSupporter?: boolean;
  tierName?: string | null;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md";
}

export function SupporterBadge({
  isSupporter,
  isActiveSupporter = true,
  tierName,
  className,
  showText = true,
  size = "sm",
}: SupporterBadgeProps) {
  if (!isSupporter) return null;

  const isSmall = size === "sm";

  if (isActiveSupporter) {
    return (
      <span
        title={
          tierName
            ? `Active Nipponic Supporter (${tierName})`
            : "Active Nipponic Supporter"
        }
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap select-none transition-all shadow-xs",
          "bg-gradient-to-r from-rose-500/15 via-pink-500/20 to-amber-500/15 text-rose-600 dark:text-rose-300 border border-rose-400/30 dark:border-rose-500/30",
          isSmall ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          className
        )}
      >
        <Heart
          size={isSmall ? 11 : 13}
          className="fill-rose-500 text-rose-500 animate-pulse"
        />
        {showText && (
          <span className="flex items-center gap-1 font-semibold">
            {tierName ? tierName : "Active Supporter"}
            <Sparkles size={isSmall ? 10 : 12} className="text-amber-500 dark:text-amber-400" />
          </span>
        )}
      </span>
    );
  }

  // Honorary / Historical Supporter
  return (
    <span
      title="Honorary Nipponic Supporter - Forever grateful for your support!"
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap select-none transition-all",
        "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30 dark:border-amber-500/30",
        isSmall ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Heart size={isSmall ? 11 : 13} className="text-amber-600 dark:text-amber-400 fill-amber-500/40" />
      {showText && (
        <span className="font-semibold">
          {tierName ? `${tierName} (Honorary)` : "Honorary Supporter"}
        </span>
      )}
    </span>
  );
}
