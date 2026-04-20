"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { CompareResult } from "@/lib/compare";
import { cn } from "@/lib/utils";

interface TradeoffSummaryProps {
  result: CompareResult;
}

export function TradeoffSummary({ result }: TradeoffSummaryProps) {
  const addrA = result.propertyA.address.city;
  const addrB = result.propertyB.address.city;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-gradient-to-br from-ink to-ink/95 text-white p-5 shadow-cardHover"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-money-light" strokeWidth={2.5} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
          Tradeoff analysis
        </span>
      </div>

      <p className="text-[14px] leading-relaxed mb-4 text-white/95">
        {result.synthesis}
      </p>

      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg border border-white/10",
        result.overallWinner === "tie" ? "bg-white/5" : "bg-money/10"
      )}>
        {result.overallWinner !== "tie" && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-money flex items-center justify-center text-white font-display font-semibold text-sm">
            {result.overallWinner === "a" ? "A" : "B"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60 mb-0.5">
            Bottom line
          </div>
          <div className="text-[13px] font-semibold leading-tight">
            {result.bottomLine}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
            A · {addrA}
          </div>
          <div className="flex flex-wrap gap-1">
            {result.tagsA.length > 0 ? (
              result.tagsA.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium bg-white/10 text-white/90 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-white/40 italic">—</span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
            B · {addrB}
          </div>
          <div className="flex flex-wrap gap-1">
            {result.tagsB.length > 0 ? (
              result.tagsB.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-medium bg-white/10 text-white/90 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-white/40 italic">—</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
