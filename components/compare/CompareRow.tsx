"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { MetricComparison } from "@/lib/compare";

interface CompareRowProps {
  metric: MetricComparison;
}

export function CompareRow({ metric }: CompareRowProps) {
  const isTie = metric.winner === "tie";
  const aWins = metric.winner === "a";
  const bWins = metric.winner === "b";

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-ink-secondary">
          {metric.label}
        </span>
        {metric.note && (
          <span className="text-[10px] text-ink-tertiary italic">
            {metric.note}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Property A value */}
        <div className={cn(
          "text-right text-[15px] font-semibold tabular",
          aWins && "text-money",
          bWins && "text-ink-tertiary",
          isTie && "text-ink"
        )}>
          {metric.formattedA}
        </div>

        {/* Delta visual — arrow or equals */}
        <div className="flex items-center justify-center w-10">
          {isTie ? (
            <span className="text-[11px] text-ink-tertiary font-mono">≈</span>
          ) : (
            <DeltaBar winner={metric.winner} magnitude={metric.magnitude} />
          )}
        </div>

        {/* Property B value */}
        <div className={cn(
          "text-left text-[15px] font-semibold tabular",
          bWins && "text-money",
          aWins && "text-ink-tertiary",
          isTie && "text-ink"
        )}>
          {metric.formattedB}
        </div>
      </div>
    </div>
  );
}

// ─── Delta visual — a tiny filled arrow pointing at the winner ──────────────

function DeltaBar({
  winner,
  magnitude,
}: {
  winner: "a" | "b" | "tie";
  magnitude: number;
}) {
  // Height of the indicator — higher magnitude = taller
  const size = Math.max(0.5, Math.min(1, magnitude));

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-center"
    >
      <svg
        width="28"
        height="8"
        viewBox="0 0 28 8"
        fill="none"
        className={cn(winner === "a" ? "rotate-180" : "")}
      >
        <path
          d="M0 4 L20 4 M16 1 L20 4 L16 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-money"
          style={{ opacity: 0.4 + size * 0.6 }}
        />
      </svg>
    </motion.div>
  );
}
