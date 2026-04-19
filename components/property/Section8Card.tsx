"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { AIInsight } from "@/components/ui/AIInsight";
import { formatMoney } from "@/lib/utils";

interface Section8CardProps {
  fmrMonthly: number;       // e.g. 2350
  marketRentMonthly: number; // e.g. 2100
  premiumMonthly: number;    // e.g. 250
  waitlistLength: number;
}

export function Section8Card({
  fmrMonthly,
  marketRentMonthly,
  premiumMonthly,
  waitlistLength,
}: Section8CardProps) {
  const annualExtra = premiumMonthly * 12;

  // For the horizontal bar comparison — normalize to FMR as 100%
  const fmrPct = 100;
  const marketPct = (marketRentMonthly / fmrMonthly) * 100;
  const extraPct = fmrPct - marketPct;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 pr-2">
          <h3 className="text-base font-semibold leading-tight">
            Government-backed
            <br />
            rent pays
          </h3>
        </div>
        <Badge variant="section8">
          +{formatMoney(premiumMonthly)} more per month
        </Badge>
      </div>
      <div className="text-xs text-ink-secondary mb-4">
        Section 8 pays above market rate for this unit size
      </div>

      <div className="text-[11px] uppercase tracking-wider text-ink-tertiary font-medium mb-2">
        Comparison
      </div>

      {/* Horizontal stacked bars */}
      <div className="space-y-2 mb-4">
        <BarRow
          label="Section 8"
          amount={fmrMonthly}
          widthPct={100}
          color="bg-money"
          delay={0}
        />
        <BarRow
          label="Market Rent"
          amount={marketRentMonthly}
          widthPct={marketPct}
          color="bg-ink-muted"
          delay={0.15}
        />
        <BarRow
          label="Extra income"
          amount={premiumMonthly}
          widthPct={extraPct}
          color="bg-money-light"
          delay={0.3}
          showPlus
        />
      </div>

      {/* Profit in a year */}
      <div className="bg-paper-soft border border-paper-stroke rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-secondary mb-0.5">
              Your profit in a year
            </div>
            <div className="font-display text-xl font-semibold tabular">
              {formatMoney(premiumMonthly)}
              <span className="text-base text-ink-secondary">/month</span>
              <span className="text-base text-ink-secondary"> = </span>
              <span className="text-money">{formatMoney(annualExtra)}</span>
              <span className="text-base text-ink-secondary">/year</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-ink-secondary mt-2">
          The government pays you directly, reducing missed or late payments.
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs text-ink-secondary">
        <div className="w-1.5 h-1.5 rounded-full bg-money" />
        <span className="tabular">{waitlistLength.toLocaleString()} vouchers on waitlist nearby</span>
      </div>

      <AIInsight tone="warm">
        This is a strong option if you're looking for higher and more stable cashflow.
      </AIInsight>
    </div>
  );
}

function BarRow({
  label,
  amount,
  widthPct,
  color,
  delay,
  showPlus = false,
}: {
  label: string;
  amount: number;
  widthPct: number;
  color: string;
  delay: number;
  showPlus?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 text-xs font-medium text-ink-secondary flex-shrink-0">
        {label}
      </div>
      <div className="flex-1 h-7 bg-paper-soft rounded-md overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full ${color} rounded-md flex items-center justify-end pr-2`}
        >
          <span className="text-[11px] font-semibold text-white tabular whitespace-nowrap">
            {showPlus ? "+" : ""}
            {formatMoney(amount)}/month
          </span>
        </motion.div>
      </div>
    </div>
  );
}
