"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown } from "lucide-react";
import { cn, formatPercent } from "@/lib/utils";

interface VacancyCardProps {
  thisProperty: number;  // e.g. 0.021 for 2.1%
  stateName: string;     // "NJ" | "PA"
  stateAverage: number;  // e.g. 0.058
  usAverage: number;     // e.g. 0.066
}

export function VacancyCard({
  thisProperty,
  stateName,
  stateAverage,
  usAverage,
}: VacancyCardProps) {
  const [expanded, setExpanded] = useState(true);

  const thisPct = thisProperty * 100;
  const statePct = stateAverage * 100;
  const usPct = usAverage * 100;

  const isLowRisk = thisPct < 5;

  // Normalize for bar width display (clamp to 10% max visual)
  const maxScale = Math.max(thisPct, statePct, usPct, 8);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold mb-0.5">
            How easy is this property to rent?
          </h3>
          <div className="text-xs text-ink-secondary">
            Lower vacancy = stronger rental demand
          </div>
        </div>
        <Badge variant={isLowRisk ? "low-risk" : "medium-risk"}>
          {isLowRisk ? "Low risk" : "Moderate"}
        </Badge>
      </div>

      {/* Hero number */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="font-display text-[40px] font-semibold leading-none tabular tracking-tight">
          {formatPercent(thisPct, 1)}
        </span>
        <span className="text-sm text-ink-secondary">
          Very easy to rent
        </span>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 text-sm font-medium text-ink hover:text-signal transition-colors"
      >
        <span>See vacancy comparison</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform",
            expanded && "rotate-180"
          )}
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
            <div className="pt-2 space-y-3">
              <ComparisonRow
                label="This Property"
                sublabel="Very easy to rent"
                value={thisPct}
                maxValue={maxScale}
                highlight
              />
              <ComparisonRow
                label={`${stateName} Average`}
                sublabel={`Beats state avg by ${(statePct - thisPct).toFixed(1)}pts`}
                value={statePct}
                maxValue={maxScale}
              />
              <ComparisonRow
                label="US Average"
                sublabel="Strong nationally"
                value={usPct}
                maxValue={maxScale}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ComparisonRow({
  label,
  sublabel,
  value,
  maxValue,
  highlight = false,
}: {
  label: string;
  sublabel: string;
  value: number;
  maxValue: number;
  highlight?: boolean;
}) {
  const widthPct = Math.min(100, (value / maxValue) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div>
          <span className={cn("text-sm font-semibold", highlight && "text-signal")}>
            {label}
          </span>
          <span className="text-xs text-ink-tertiary ml-2">{sublabel}</span>
        </div>
        <span className={cn("text-sm font-semibold tabular", highlight && "text-signal")}>
          {formatPercent(value, 1)}
        </span>
      </div>
      <div className="h-1.5 bg-paper-card rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "h-full rounded-full",
            highlight ? "bg-signal" : "bg-ink-muted"
          )}
        />
      </div>
    </div>
  );
}
