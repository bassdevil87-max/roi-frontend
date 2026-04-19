"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";
import { AIInsight } from "@/components/ui/AIInsight";
import { DATA_SOURCE_LABELS, type GroundTruthScore } from "@/types/roi";
import { cn } from "@/lib/utils";

interface GroundTruthCardProps {
  score: GroundTruthScore;
}

export function GroundTruthCard({ score }: GroundTruthCardProps) {
  const [expanded, setExpanded] = useState(false);

  const pct = score.score != null ? Math.round(score.score * 100) : null;
  const tierColor =
    score.tier === "strong" ? "text-money" :
    score.tier === "mixed" ? "text-signal" :
    score.tier === "weak" ? "text-warn" :
    score.tier === "poor" ? "text-danger" :
    "text-ink-secondary";

  const tierLabel =
    score.tier === "strong" ? "Strong" :
    score.tier === "mixed" ? "Mixed" :
    score.tier === "weak" ? "Weak" :
    score.tier === "poor" ? "Poor" :
    "Unknown";

  const available = score.signals.filter((s) => s.is_available);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-semibold">Ground Truth Score</h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            What&apos;s actually happening right now, not just historical comps
          </p>
        </div>
      </div>

      {/* Score hero */}
      <div className="mt-3 flex items-end justify-between pb-3 border-b border-paper-stroke">
        <div>
          <div className="flex items-baseline gap-2">
            <span className={cn("font-display text-[36px] font-semibold leading-none tabular", tierColor)}>
              {pct ?? "—"}
            </span>
            {pct != null && (
              <span className="text-sm text-ink-tertiary tabular">/100</span>
            )}
          </div>
          <div className={cn("text-sm font-semibold mt-1", tierColor)}>{tierLabel}</div>
        </div>
        <div className="text-right max-w-[55%]">
          <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-medium mb-0.5">
            {available.length} of {score.signals.length} signals
          </div>
          <div className="text-[11px] text-ink-secondary leading-tight">
            {score.interpretation}
          </div>
        </div>
      </div>

      {/* Signal list — collapsed by default */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 text-sm font-medium"
      >
        <span>See signal breakdown</span>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform text-ink-secondary", expanded && "rotate-180")}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">
              {score.signals.map((s, i) => {
                const valPct = s.value != null ? Math.round(s.value * 100) : null;
                return (
                  <motion.div
                    key={s.name}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className={cn(
                      "rounded-lg p-3 border",
                      s.is_available
                        ? "bg-paper-soft border-paper-stroke"
                        : "bg-paper-card border-paper-stroke opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 mt-0.5">
                        {s.is_available ? (
                          <CheckCircle2 className="w-4 h-4 text-money" strokeWidth={2.5} />
                        ) : (
                          <Circle className="w-4 h-4 text-ink-tertiary" strokeWidth={2} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[13px] font-semibold text-ink">{s.name}</span>
                          {valPct != null && (
                            <span className="text-xs font-semibold tabular text-ink-secondary">
                              {valPct}/100
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-secondary mt-0.5">
                          {s.description}
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[10px]">
                          <span className="text-ink-tertiary font-medium">
                            {DATA_SOURCE_LABELS[s.source]}
                          </span>
                          <span className={cn(
                            "tabular font-medium",
                            s.is_available ? "text-ink" : "text-ink-tertiary"
                          )}>
                            {s.is_available ? s.raw_value : "not available"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIInsight tone="warm" className="mt-3">
        {score.tier === "strong"
          ? "Rising job postings and low vacancy point to strong rental demand ahead."
          : score.tier === "mixed"
          ? "Signals are mixed. Consider waiting for more confirming data or widening your margin of safety."
          : "Multiple weak signals. Underwrite this conservatively."}
      </AIInsight>
    </div>
  );
}
