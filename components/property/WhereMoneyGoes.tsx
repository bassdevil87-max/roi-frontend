"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import type { CashFlowResult, OperatingExpensesBreakdown, RentSourceBreakdown, DataSource } from "@/types/roi";
import { DATA_SOURCE_LABELS } from "@/types/roi";
import { useExpertMode } from "@/context/ExpertMode";
import { ConfidenceDot } from "@/components/ui/ConfidenceDot";
import type { ConfidenceTier } from "@/lib/confidence";

interface WhereMoneyGoesProps {
  cashFlow: CashFlowResult;
  isLeveraged: boolean;
  rentSources?: RentSourceBreakdown[];        // Optional — shown in expert mode
  rentConfidenceTier?: ConfidenceTier;
  rentConfidenceExplanation?: string;
}

export function WhereMoneyGoes({
  cashFlow,
  isLeveraged,
  rentSources,
  rentConfidenceTier,
  rentConfidenceExplanation,
}: WhereMoneyGoesProps) {
  const { expertMode } = useExpertMode();
  const [expandedSection, setExpandedSection] = useState<
    "income" | "expenses" | null
  >("expenses");

  const expenses = cashFlow.operating_expenses;
  const mortgage =
    isLeveraged && "mortgage_monthly" in cashFlow.financing
      ? cashFlow.financing.mortgage_monthly
      : 0;

  const totalExpenses = expenses.total_operating + mortgage;
  const income = cashFlow.gross_monthly_rent;
  const final = cashFlow.monthly_cash_flow;

  // Percent of income the tenant keeps vs what goes to mortgage/expenses
  const keepPct = income > 0 ? Math.max(0, Math.round((final / income) * 100)) : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold">Where the money goes</h3>
        <span className="text-[11px] text-ink-tertiary font-medium">
          Income vs Expenses
        </span>
      </div>

      {/* Donut chart + You keep X% callout */}
      <div className="flex items-center gap-4 py-4">
        <DonutChart
          income={income}
          expenses={totalExpenses}
          final={final}
        />
        <div className="flex-1">
          <div className="text-[11px] text-ink-tertiary uppercase tracking-wider mb-0.5">
            You keep
          </div>
          <div className="font-display text-2xl font-semibold text-money tabular">
            {keepPct}%
          </div>
          <div className="text-xs text-ink-secondary mt-0.5">
            of the rent
          </div>
        </div>

        {/* Three pill stack showing the math */}
        <div className="flex flex-col gap-1.5">
          <Pill color="bg-signal/10 text-signal" label="Income" value={formatMoney(income)} />
          <Pill color="bg-danger/10 text-danger" label="Expenses" value={`-${formatMoney(totalExpenses)}`} />
          <Pill color="bg-money/10 text-money" label="Final" value={formatMoney(final, { sign: true })} />
        </div>
      </div>

      <div className="hairline my-2" />

      {/* Income section */}
      <ExpandableRow
        label="Income"
        value={formatMoney(income, { sign: true })}
        subtitle="Rent paid by your tenant each month"
        valueColor="text-money"
        expanded={expandedSection === "income"}
        onToggle={() =>
          setExpandedSection(expandedSection === "income" ? null : "income")
        }
      >
        <Line label="Monthly rent" detail="From your tenant" value={formatMoney(income, { sign: true })} valueColor="text-money" />

        {/* Expert mode — per-source rent blend */}
        {expertMode && rentSources && rentSources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-dashed border-ink/10">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-ink-tertiary font-semibold uppercase tracking-wider">
                  Rent sources
                </span>
                {rentConfidenceTier && (
                  <ConfidenceDot tier={rentConfidenceTier} explanation={rentConfidenceExplanation} />
                )}
              </div>
              <span className="text-[10px] text-ink-tertiary">
                weighted blend
              </span>
            </div>
            <div className="space-y-1">
              {rentSources.map((s) => (
                <RentSourceRow key={s.source} source={s} />
              ))}
            </div>
          </div>
        )}
      </ExpandableRow>

      <div className="hairline my-1" />

      {/* Expenses section */}
      <ExpandableRow
        label="Expenses"
        value={`-${formatMoney(totalExpenses)}`}
        subtitle="Total monthly costs to own and run this property"
        valueColor="text-danger"
        expanded={expandedSection === "expenses"}
        onToggle={() =>
          setExpandedSection(expandedSection === "expenses" ? null : "expenses")
        }
      >
        {isLeveraged && mortgage > 0 && (
          <Line
            label="Mortgage"
            detail="Your monthly loan payment"
            value={`-${formatMoney(mortgage)}`}
          />
        )}
        <ExpenseLines expenses={expenses} />
      </ExpandableRow>

      <div className="hairline my-1" />

      {/* Monthly profit — the bottom line */}
      <div className="flex items-center justify-between py-3">
        <div>
          <div className="text-[15px] font-semibold">Monthly Profit</div>
          <div className="text-xs text-ink-secondary">
            What you keep after all expenses
          </div>
        </div>
        <div className="font-display text-xl font-semibold text-money tabular">
          {formatMoney(final, { sign: true })}
          <span className="text-sm font-medium text-ink-secondary">/mo</span>
        </div>
      </div>

      <div className="mt-2 text-[11px] text-ink-tertiary text-center">
        Most of your cost comes from your {isLeveraged ? "mortgage" : "property tax"}
      </div>
    </div>
  );
}

function DonutChart({
  income,
  expenses,
  final,
}: {
  income: number;
  expenses: number;
  final: number;
}) {
  const total = income;
  const expenseDeg = total > 0 ? (expenses / total) * 360 : 0;
  const finalDeg = total > 0 ? (Math.max(0, final) / total) * 360 : 0;

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
        {/* Background ring */}
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="#F5F5F4"
          strokeWidth="12"
        />
        {/* Expenses arc (red) */}
        <motion.circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="#C2410C"
          strokeWidth="12"
          strokeDasharray={`${(expenseDeg / 360) * 201} 201`}
          strokeLinecap="round"
          initial={{ strokeDasharray: "0 201" }}
          animate={{ strokeDasharray: `${(expenseDeg / 360) * 201} 201` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Profit arc (green) — starts where expenses end */}
        <motion.circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="#0C7C3D"
          strokeWidth="12"
          strokeDasharray={`${(finalDeg / 360) * 201} 201`}
          strokeDashoffset={`-${(expenseDeg / 360) * 201}`}
          strokeLinecap="round"
          initial={{ strokeDasharray: "0 201" }}
          animate={{ strokeDasharray: `${(finalDeg / 360) * 201} 201` }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[9px] text-ink-tertiary uppercase tracking-wider leading-tight">
            Net
          </div>
          <div className="text-[11px] font-semibold text-money tabular">
            ${final.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 px-2.5 py-1 rounded-lg", color)}>
      <span className="text-[11px] font-medium">{label}</span>
      <span className="text-[11px] font-semibold tabular ml-auto">{value}</span>
    </div>
  );
}

function ExpandableRow({
  label,
  value,
  subtitle,
  valueColor,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  value: string;
  subtitle: string;
  valueColor: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between py-2.5 group"
      >
        <div className="text-left flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold">{label}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-ink-tertiary transition-transform duration-200",
                expanded && "rotate-180"
              )}
              strokeWidth={2}
            />
          </div>
          <div className="text-xs text-ink-secondary mt-0.5">{subtitle}</div>
        </div>
        <div className={cn("font-display text-lg font-semibold tabular", valueColor)}>
          {value}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-2 space-y-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExpenseLines({ expenses }: { expenses: OperatingExpensesBreakdown }) {
  const items: Array<{ label: string; detail: string; value: number }> = [
    { label: "Property tax", detail: "Covers damage and liability", value: expenses.property_tax },
    { label: "Insurance", detail: "Covers damage and liability", value: expenses.insurance },
    { label: "Management", detail: "Someone handles tenants and repairs", value: expenses.property_management },
    { label: "Vacancy reserve", detail: "Buffer for empty months", value: expenses.vacancy_reserve },
    { label: "Maintenance fund", detail: "Set aside for big repairs", value: expenses.capex_reserve },
  ];
  if (expenses.hoa > 0) items.push({ label: "HOA", detail: "Monthly association dues", value: expenses.hoa });
  if (expenses.flood_insurance > 0)
    items.push({
      label: "Flood insurance",
      detail: "Required in FEMA high-risk zone",
      value: expenses.flood_insurance,
    });

  return (
    <>
      {items
        .filter((i) => i.value > 0)
        .map((item) => (
          <Line
            key={item.label}
            label={item.label}
            detail={item.detail}
            value={`-${formatMoney(item.value)}`}
          />
        ))}
    </>
  );
}

function Line({
  label,
  detail,
  value,
  valueColor = "text-ink",
}: {
  label: string;
  detail: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start justify-between py-2 pl-1">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-ink-tertiary mt-0.5">{detail}</div>
      </div>
      <div className={cn("text-sm font-semibold tabular", valueColor)}>
        {value}
      </div>
    </div>
  );
}

function RentSourceRow({ source }: { source: RentSourceBreakdown }) {
  const label = DATA_SOURCE_LABELS[source.source as DataSource] ?? source.source;
  return (
    <div
      className={cn(
        "flex items-center justify-between px-2 py-1.5 rounded-md",
        source.is_available ? "bg-paper-soft" : "bg-paper-card opacity-60"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] font-semibold text-ink truncate">{label}</span>
        <span className="text-[9px] text-ink-tertiary font-medium tabular flex-shrink-0">
          weight {source.weight.toFixed(1)}
        </span>
      </div>
      <div className="text-[11px] tabular flex items-center gap-2 flex-shrink-0">
        {source.is_available && source.rent_estimate != null ? (
          <>
            <span className="text-ink-tertiary text-[9px]">
              {source.comp_count} comps
            </span>
            <span className="font-semibold text-ink">
              ${source.rent_estimate.toLocaleString()}
            </span>
          </>
        ) : (
          <span className="text-ink-tertiary text-[10px] italic">not available</span>
        )}
      </div>
    </div>
  );
}

