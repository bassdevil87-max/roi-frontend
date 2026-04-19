"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatusBar } from "@/components/ui/StatusBar";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ThesisProgress } from "@/components/thesis/ThesisProgress";
import { ChoiceCard } from "@/components/thesis/ChoiceCard";
import { storage, STORAGE_KEYS } from "@/lib/storage";

type Goal = "cash_flow" | "appreciation" | "balanced";

const GOALS: Array<{ value: Goal; icon: string; title: string; subtitle: string }> = [
  {
    value: "cash_flow",
    icon: "💰",
    title: "Cash flow",
    subtitle: "Monthly income from rent. Best for covering your bills and building passive income.",
  },
  {
    value: "appreciation",
    icon: "📈",
    title: "Appreciation",
    subtitle: "Long-term property value growth. Best if you can wait 5+ years for bigger returns.",
  },
  {
    value: "balanced",
    icon: "⚖️",
    title: "Balanced",
    subtitle: "A mix of both. Solid monthly income plus reasonable long-term appreciation.",
  },
];

export default function ThesisGoalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Goal | null>(null);

  // Pre-fill from stored thesis if the user has been here before
  useEffect(() => {
    const saved = storage.get<Goal>(STORAGE_KEYS.thesis_goal);
    if (saved) setSelected(saved);
  }, []);

  return (
    <>
      <StatusBar />
      <AppHeader />
      <ThesisProgress current={0} total={3} />

      <div className="px-5 pt-3 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider mb-2">
            Step 1 of 3
          </div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight mb-2">
            What are you optimizing for?
          </h1>
          <p className="text-[14px] text-ink-secondary leading-relaxed">
            We weight the match score differently for each. Cash flow rewards properties with high cap rates; appreciation rewards neighborhoods with strong growth fundamentals.
          </p>
        </motion.div>

        <div className="space-y-3">
          {GOALS.map((goal, i) => (
            <motion.div
              key={goal.value}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
            >
              <ChoiceCard
                icon={goal.icon}
                title={goal.title}
                subtitle={goal.subtitle}
                selected={selected === goal.value}
                onClick={() => setSelected(goal.value)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="sticky-cta">
        <Button
          size="l"
          fullWidth
          disabled={!selected}
          onClick={() => {
            if (selected) {
              storage.set(STORAGE_KEYS.thesis_goal, selected);
              router.push("/thesis/geography");
            }
          }}
        >
          Continue
        </Button>
      </div>
    </>
  );
}
