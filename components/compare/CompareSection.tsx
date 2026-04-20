"use client";

import { motion } from "framer-motion";
import { CompareRow } from "./CompareRow";
import type { MetricComparison } from "@/lib/compare";

interface CompareSectionProps {
  label: string;
  metrics: MetricComparison[];
  index?: number;
}

export function CompareSection({ label, metrics, index = 0 }: CompareSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.08 }}
      className="card"
    >
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">
        {label}
      </h3>
      <div className="divide-y divide-paper-stroke">
        {metrics.map((m) => (
          <CompareRow key={m.label} metric={m} />
        ))}
      </div>
    </motion.div>
  );
}
