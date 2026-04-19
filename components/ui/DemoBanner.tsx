"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoBannerProps {
  className?: string;
  text?: string;
}

/**
 * Subtle banner that keeps users (especially domain experts) oriented on
 * which data is real vs mock. Transparency builds trust; hiding the demo
 * status backfires once advisors notice.
 */
export function DemoBanner({
  className,
  text = "Demo mode — showing sample properties with realistic data",
}: DemoBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 bg-warn/10 border border-warn/25 rounded-lg",
        className
      )}
    >
      <AlertCircle className="w-3.5 h-3.5 text-warn flex-shrink-0" strokeWidth={2.2} />
      <span className="text-[11px] text-ink font-medium">{text}</span>
    </div>
  );
}
