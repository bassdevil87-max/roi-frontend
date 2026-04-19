"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ConfidenceTier } from "@/lib/confidence";

interface ConfidenceDotProps {
  tier: ConfidenceTier;
  label?: string;             // e.g. "Data confidence"
  explanation?: string;       // Shown in tooltip/popover
  size?: "sm" | "md";
  showLabel?: boolean;        // Show text next to dot
  className?: string;
}

const TIER_COLORS: Record<ConfidenceTier, { dot: string; ring: string; label: string }> = {
  high: {
    dot: "bg-money",
    ring: "ring-money/30",
    label: "text-money",
  },
  medium: {
    dot: "bg-warn",
    ring: "ring-warn/30",
    label: "text-warn",
  },
  low: {
    dot: "bg-danger",
    ring: "ring-danger/30",
    label: "text-danger",
  },
};

const TIER_LABELS: Record<ConfidenceTier, string> = {
  high: "High confidence",
  medium: "Moderate",
  low: "Low confidence",
};

export function ConfidenceDot({
  tier,
  label,
  explanation,
  size = "sm",
  showLabel = false,
  className,
}: ConfidenceDotProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dotSize = size === "md" ? "w-2.5 h-2.5" : "w-2 h-2";
  const colors = TIER_COLORS[tier];

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasDetails = !!explanation;

  return (
    <div ref={ref} className={cn("relative inline-flex items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (hasDetails) setOpen(!open);
        }}
        className={cn(
          "relative inline-flex items-center gap-1.5 transition-opacity",
          hasDetails ? "cursor-help hover:opacity-80" : "cursor-default"
        )}
        aria-label={`${TIER_LABELS[tier]}${explanation ? `: ${explanation}` : ""}`}
      >
        <span className="relative flex items-center justify-center">
          <span
            className={cn(
              "absolute inline-flex rounded-full opacity-50 animate-ping",
              dotSize,
              colors.dot
            )}
            style={{ animationDuration: tier === "high" ? "2.5s" : "1.5s" }}
          />
          <span
            className={cn(
              "relative inline-block rounded-full ring-2",
              dotSize,
              colors.dot,
              colors.ring
            )}
          />
        </span>
        {showLabel && (
          <span className={cn("text-[11px] font-semibold", colors.label)}>
            {label ?? TIER_LABELS[tier]}
          </span>
        )}
      </button>

      {/* Popover */}
      <AnimatePresence>
        {open && hasDetails && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 w-64"
          >
            <div className="bg-ink text-white rounded-lg shadow-card p-3">
              <div className={cn("flex items-center gap-1.5 text-[11px] font-semibold mb-1.5")}>
                <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                <span>{label ?? TIER_LABELS[tier]}</span>
              </div>
              <div className="text-[12px] leading-snug text-white/85">
                {explanation}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
