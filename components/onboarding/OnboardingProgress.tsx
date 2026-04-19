"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  current: number;     // 0-indexed
  total: number;
  className?: string;
}

/**
 * Lightweight progress indicator for the onboarding flow. Different style
 * from the thesis builder's progress bar to help users distinguish "account
 * setup" from "investing strategy setup".
 */
export function OnboardingProgress({ current, total, className }: OnboardingProgressProps) {
  return (
    <div className={cn("px-6 pt-1 pb-3", className)}>
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
        {Array.from({ length: total }).map((_, i) => {
          const state = i < current ? "done" : i === current ? "active" : "upcoming";
          return (
            <motion.div
              key={i}
              layout
              className={cn(
                "h-1 rounded-full transition-colors",
                state === "done" && "bg-ink flex-1",
                state === "active" && "bg-ink flex-[2]",
                state === "upcoming" && "bg-paper-stroke flex-1"
              )}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          );
        })}
      </div>
      <div className="text-[10px] text-ink-tertiary font-medium uppercase tracking-wider mt-1.5 tabular">
        Step {current + 1} of {total} · Account setup
      </div>
    </div>
  );
}
