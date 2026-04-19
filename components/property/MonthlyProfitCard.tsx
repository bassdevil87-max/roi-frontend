"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Segmented } from "@/components/ui/Segmented";
import { AIInsight } from "@/components/ui/AIInsight";
import { ConfidenceDot } from "@/components/ui/ConfidenceDot";
import { cn, formatMoney, formatPercent } from "@/lib/utils";
import type { CashFlowResult, FinancingView } from "@/types/roi";
import type { ProfitConfidence } from "@/lib/confidence";
import { Pencil } from "lucide-react";

interface MonthlyProfitCardProps {
  leveraged: CashFlowResult;
  cash: CashFlowResult;
  onEditDownPayment?: () => void;
  vacancyRatePct?: number;
  confidence?: ProfitConfidence;
}

type View = "mortgage" | "cash";

export function MonthlyProfitCard({
  leveraged,
  cash,
  onEditDownPayment,
  vacancyRatePct = 2.1,
  confidence,
}: MonthlyProfitCardProps) {
  const [view, setView] = useState<View>("mortgage");

  const active = view === "mortgage" ? leveraged : cash;
  const leveragedFin = leveraged.financing as FinancingView;


  const { dollars, cents } = useMemo(() => {
    const value = active.monthly_cash_flow;
    const d = Math.floor(value);
    const c = Math.round((value - d) * 100);
    return {
      dollars: d.toLocaleString("en-US"),
      cents: c.toString().padStart(2, "0"),
    };
  }, [active.monthly_cash_flow]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="card relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-ink-secondary font-medium">
          Your Monthly Profit
        </div>
        {confidence && (
          <ConfidenceDot
            tier={confidence.tier}
            label={`${confidence.composite_score}/100`}
            explanation={confidence.summary}
            showLabel
          />
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex items-baseline"
          >
            <span className="font-display text-[44px] font-semibold leading-none tabular tracking-tight">
              ${dollars}
            </span>
            <span className="font-display text-[28px] font-medium text-ink-secondary leading-none tabular ml-1">
              .{cents}
            </span>
            <span className="text-sm text-ink-secondary ml-2">/mo</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Cash-at-start / Annual income / Return row */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-paper-stroke">
        {view === "mortgage" ? (
          <>
            <StatItem
              label="Cash to start"
              value={formatMoney(leveragedFin.down_payment_amount)}
            />
            <StatItem
              label="Annual income"
              value={formatMoney(leveraged.annual_cash_flow)}
            />
            <StatItem
              label="Return"
              value={formatPercent(leveraged.cash_on_cash_return_pct ?? 0, 1)}
              highlight
            />
          </>
        ) : (
          <>
            <StatItem
              label="Cash invested"
              value={formatMoney(cash.purchase_price)}
            />
            <StatItem
              label="Annual NOI"
              value={formatMoney(cash.annual_cash_flow)}
            />
            <StatItem
              label="Cap rate"
              value={formatPercent(cash.cap_rate_pct, 2)}
              highlight
            />
          </>
        )}
      </div>

      {/* Mortgage / All Cash segmented */}
      <Segmented
        options={[
          { value: "mortgage", label: "Mortgage" },
          { value: "cash", label: "All Cash" },
        ]}
        value={view}
        onChange={setView}
        className="mb-4"
      />

      {/* Down / Interest / Time — only visible in Mortgage mode */}
      <AnimatePresence>
        {view === "mortgage" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-3 mb-3">
              <InputStat label="Down" value={`${leveragedFin.down_payment_pct}%`} />
              <InputStat label="Interest" value={`${leveragedFin.interest_rate_pct.toFixed(1)}%`} />
              <InputStat label="Time" value={`${leveragedFin.loan_term_years} Years`} />
            </div>
            <button
              onClick={onEditDownPayment}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-signal hover:text-signal-dark transition-colors py-1"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
              Edit down payment
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Insight */}
      <div className="mt-4">
        <AIInsight>
          Low vacancy ({formatPercent(vacancyRatePct, 1)}) and steady rent make this a reliable income property.
        </AIInsight>
      </div>
    </motion.div>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-ink-tertiary font-medium uppercase tracking-wider mb-1">
        {label}
      </div>
      <div
        className={cn(
          "text-[15px] font-semibold tabular",
          highlight ? "text-money" : "text-ink"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function InputStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper-soft border border-paper-stroke rounded-lg px-3 py-2.5">
      <div className="text-[10px] text-ink-tertiary font-medium uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-sm font-semibold tabular">{value}</div>
    </div>
  );
}
