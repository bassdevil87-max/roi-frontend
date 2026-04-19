"use client";

import { Badge } from "@/components/ui/Badge";
import { AIInsight } from "@/components/ui/AIInsight";
import { motion } from "framer-motion";

interface Risk {
  title: string;
  description: string;
  impact: "medium" | "high";
  icon: string;
}

interface RisksSectionProps {
  risks: Risk[];
}

export function RisksSection({ risks }: RisksSectionProps) {
  if (risks.length === 0) return null;

  return (
    <div className="card">
      <div className="mb-1">
        <h3 className="text-base font-semibold">Things to consider</h3>
        <p className="text-xs text-ink-secondary mt-0.5">
          This property comes with a few risks you should be aware of.
        </p>
      </div>

      <div className="mt-3 space-y-2">
        {risks.map((risk, i) => (
          <RiskRow key={risk.title} risk={risk} index={i} />
        ))}
      </div>

      <div className="mt-4">
        <AIInsight>
          This property offers solid returns, but comes with higher costs and risks.
        </AIInsight>
      </div>
    </div>
  );
}

function RiskRow({ risk, index }: { risk: Risk; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-paper-soft border border-paper-stroke rounded-xl p-3"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden>{risk.icon}</span>
          <span className="text-sm font-semibold text-ink">{risk.title}</span>
        </div>
        <Badge variant={risk.impact === "high" ? "high-cost" : "medium-risk"}>
          {risk.impact === "high" ? "High cost impact" : "Medium risk"}
        </Badge>
      </div>
      <p className="text-xs text-ink-secondary leading-relaxed pl-7">
        {risk.description}
      </p>
    </motion.div>
  );
}
