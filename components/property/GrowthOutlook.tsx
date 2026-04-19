"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Segmented } from "@/components/ui/Segmented";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Check, ChevronDown } from "lucide-react";
import { cn, formatMoney, formatMoneyCompact } from "@/lib/utils";

interface GrowthOutlookProps {
  currentValue: number;
  projectedValue: number;
  horizonYears: number;
  reasons: string[];
}

type Metric = "value" | "percentage" | "rent";

export function GrowthOutlook({
  currentValue,
  projectedValue,
  horizonYears,
  reasons,
}: GrowthOutlookProps) {
  const [metric, setMetric] = useState<Metric>("value");
  const [range, setRange] = useState<"3M" | "6M" | "1Y" | "3Y" | "YTD">("3Y");
  const [reasonsExpanded, setReasonsExpanded] = useState(true);

  const increase = projectedValue - currentValue;
  const increasePct = (increase / currentValue) * 100;

  // Generate projection data — exponential curve fit between now and projection
  const data = generateProjection(currentValue, projectedValue, horizonYears, range);

  // Transform based on metric
  const displayData = data.map((d) => {
    if (metric === "value") return { ...d, display: d.value };
    if (metric === "percentage")
      return { ...d, display: ((d.value - currentValue) / currentValue) * 100 };
    // Rent — scale to rent proportionally
    return { ...d, display: (d.value / currentValue) * 2100 };
  });

  const formatY = (v: number) => {
    if (metric === "value") return formatMoneyCompact(v);
    if (metric === "percentage") return `${v.toFixed(0)}%`;
    return formatMoneyCompact(v);
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold mb-0.5">Growth outlook</h3>
          <div className="text-xs text-ink-secondary">
            Projected over {horizonYears} years
          </div>
        </div>
      </div>

      {/* Hero projection number */}
      <div className="mb-3">
        <div className="text-[11px] text-ink-tertiary uppercase tracking-wider mb-0.5 font-medium">
          Your property could be worth
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[28px] font-semibold tabular leading-none">
            {formatMoney(projectedValue)}
          </span>
          <span className="text-sm text-ink-secondary">in {horizonYears} years</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 pb-3 border-b border-paper-stroke">
          <div>
            <div className="text-[11px] text-ink-tertiary uppercase tracking-wider mb-0.5">
              Increase
            </div>
            <div className="text-sm font-semibold text-money tabular">
              +{formatMoney(increase)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-ink-tertiary uppercase tracking-wider mb-0.5">
              Per year
            </div>
            <div className="text-sm font-semibold text-money tabular">
              +{(increasePct / horizonYears).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Metric tabs */}
      <Segmented
        options={[
          { value: "value", label: "Value" },
          { value: "percentage", label: "Percentage" },
          { value: "rent", label: "Rent" },
        ]}
        value={metric}
        onChange={setMetric}
        variant="subtle"
        className="mb-3"
      />

      {/* Chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={metric}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-40 -mx-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0C7C3D" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0C7C3D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#A3A3A3" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const v = payload[0].payload.display as number;
                  return (
                    <div className="bg-ink text-white px-2 py-1 rounded-md text-xs font-medium tabular">
                      {formatY(v)}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="display"
                stroke="#0C7C3D"
                strokeWidth={2}
                fill="url(#growthGrad)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>

      {/* Range selector */}
      <div className="flex justify-between mt-2 px-2">
        {(["3M", "6M", "1Y", "3Y", "YTD"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "text-[11px] font-semibold px-3 py-1 rounded-md transition-colors",
              range === r
                ? "bg-signal text-white"
                : "text-ink-secondary hover:bg-paper-card"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* See why this is growing */}
      <button
        onClick={() => setReasonsExpanded(!reasonsExpanded)}
        className="w-full flex items-center justify-between py-3 mt-3 text-sm font-medium border-t border-paper-stroke"
      >
        <span>See why this is growing</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform text-ink-secondary",
            reasonsExpanded && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {reasonsExpanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden space-y-2.5"
          >
            {reasons.map((reason, i) => (
              <motion.li
                key={reason}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 + 0.1 }}
                className="flex items-start gap-2.5 pb-1"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-money-bg flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-money" strokeWidth={3} />
                </div>
                <span className="text-sm text-ink leading-tight">{reason}</span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function generateProjection(
  current: number,
  projected: number,
  years: number,
  range: string
): Array<{ label: string; value: number }> {
  // Use exponential interpolation for a realistic growth curve
  const growthRate = Math.pow(projected / current, 1 / years);
  const points = 12;

  const labels = range === "3M"
    ? ["Jan", "Feb", "Mar"]
    : range === "6M"
    ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    : range === "1Y"
    ? ["Q1", "Q2", "Q3", "Q4"]
    : range === "YTD"
    ? ["Jan", "Mar", "May", "Jul", "Sep", "Nov"]
    : ["2025", "2026", "2027", "2028"];

  return Array.from({ length: labels.length }, (_, i) => {
    const t = (i / (labels.length - 1)) * (range === "3Y" ? years : years / 4);
    return {
      label: labels[i],
      value: current * Math.pow(growthRate, t),
    };
  });
}
