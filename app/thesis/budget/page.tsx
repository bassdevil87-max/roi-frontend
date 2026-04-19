"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatusBar } from "@/components/ui/StatusBar";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ThesisProgress } from "@/components/thesis/ThesisProgress";
import { ChoiceCard } from "@/components/thesis/ChoiceCard";
import { createThesis } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { storage, STORAGE_KEYS } from "@/lib/storage";

type PropertyTypePref = "single_family_only" | "multi_family_only" | "any";

const PROP_TYPES: Array<{
  value: PropertyTypePref;
  icon: string;
  title: string;
  subtitle: string;
}> = [
  {
    value: "single_family_only",
    icon: "🏠",
    title: "Single family homes",
    subtitle: "Simpler to manage. Better appreciation. One tenant at a time.",
  },
  {
    value: "multi_family_only",
    icon: "🏘️",
    title: "Multi-family (2-4 units)",
    subtitle: "Higher cash flow. Multiple rent streams. More to manage.",
  },
  {
    value: "any",
    icon: "✨",
    title: "Show me everything",
    subtitle: "Let the numbers decide. We'll surface the best deals either way.",
  },
];

const BUDGETS = [100_000, 200_000, 300_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000];

export default function ThesisBudgetPage() {
  const router = useRouter();
  const [propType, setPropType] = useState<PropertyTypePref | null>(null);
  const [minBudget, setMinBudget] = useState(100_000);
  const [maxBudget, setMaxBudget] = useState(500_000);

  // Pre-fill from stored thesis
  useEffect(() => {
    const savedType = storage.get<PropertyTypePref>(STORAGE_KEYS.thesis_prop_type);
    const savedMin = storage.get<number>(STORAGE_KEYS.thesis_min_price);
    const savedMax = storage.get<number>(STORAGE_KEYS.thesis_max_price);
    if (savedType) setPropType(savedType);
    if (typeof savedMin === "number") setMinBudget(savedMin);
    if (typeof savedMax === "number") setMaxBudget(savedMax);
  }, []);

  const canContinue = !!propType;

  const handleContinue = async () => {
    if (!propType) return;

    const goal = storage.get<string>(STORAGE_KEYS.thesis_goal) || "cash_flow";
    const states = storage.get<string[]>(STORAGE_KEYS.thesis_states) || [];

    storage.set(STORAGE_KEYS.thesis_prop_type, propType);
    storage.set(STORAGE_KEYS.thesis_min_price, minBudget);
    storage.set(STORAGE_KEYS.thesis_max_price, maxBudget);
    storage.set(STORAGE_KEYS.thesis_completed, true);

    try {
      const res = await createThesis({
        user_id: "demo_user",
        goal: goal as "cash_flow" | "appreciation" | "balanced",
        property_type_pref: propType,
        states,
        min_price: minBudget,
        max_price: maxBudget,
      });
      storage.set("thesis_id", res.thesis_id);
    } catch {
      storage.set("thesis_id", "demo_thesis_001");
    }
    router.push("/thesis/scanning");
  };

  return (
    <>
      <StatusBar />
      <AppHeader />
      <ThesisProgress current={2} total={3} />

      <div className="px-5 pt-3 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider mb-2">
            Step 3 of 3
          </div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight mb-2">
            What&apos;s your budget?
          </h1>
          <p className="text-[14px] text-ink-secondary leading-relaxed">
            Set your target price range and which property types you&apos;ll consider. We&apos;ll filter out anything that doesn&apos;t fit.
          </p>
        </motion.div>

        {/* Budget range */}
        <div className="mb-6">
          <label className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider mb-3 block">
            Purchase price range
          </label>

          <div className="bg-paper-card rounded-2xl p-4 mb-3">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="text-[11px] text-ink-tertiary font-medium uppercase tracking-wider">Min</div>
                <div className="font-display text-xl font-semibold tabular">
                  {formatMoney(minBudget)}
                </div>
              </div>
              <div className="text-ink-tertiary">—</div>
              <div className="text-right">
                <div className="text-[11px] text-ink-tertiary font-medium uppercase tracking-wider">Max</div>
                <div className="font-display text-xl font-semibold tabular">
                  {formatMoney(maxBudget)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="col-span-4 text-[11px] text-ink-tertiary font-medium mb-1">Min</div>
            {BUDGETS.slice(0, 4).map((b) => (
              <button
                key={`min-${b}`}
                onClick={() => {
                  setMinBudget(b);
                  if (maxBudget <= b) setMaxBudget(Math.min(2_000_000, b * 2));
                }}
                className={`px-2 py-2 rounded-lg text-[12px] font-medium tabular transition-all ${
                  minBudget === b
                    ? "bg-ink text-white"
                    : "bg-paper-card text-ink hover:bg-paper-stroke"
                }`}
              >
                {b >= 1_000_000 ? `$${(b / 1_000_000).toFixed(1)}M` : `$${b / 1000}k`}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-4 text-[11px] text-ink-tertiary font-medium mb-1 mt-2">Max</div>
            {BUDGETS.slice(2).map((b) => (
              <button
                key={`max-${b}`}
                onClick={() => setMaxBudget(b)}
                disabled={b <= minBudget}
                className={`px-2 py-2 rounded-lg text-[12px] font-medium tabular transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  maxBudget === b
                    ? "bg-ink text-white"
                    : "bg-paper-card text-ink hover:bg-paper-stroke"
                }`}
              >
                {b >= 1_000_000 ? `$${(b / 1_000_000).toFixed(1)}M` : `$${b / 1000}k`}
              </button>
            ))}
          </div>
        </div>

        {/* Property type */}
        <label className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider mb-3 block">
          Property type
        </label>
        <div className="space-y-3">
          {PROP_TYPES.map((pt) => (
            <ChoiceCard
              key={pt.value}
              icon={pt.icon}
              title={pt.title}
              subtitle={pt.subtitle}
              selected={propType === pt.value}
              onClick={() => setPropType(pt.value)}
            />
          ))}
        </div>
      </div>

      <div className="sticky-cta">
        <Button
          size="l"
          fullWidth
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Build my feed
        </Button>
      </div>
    </>
  );
}
