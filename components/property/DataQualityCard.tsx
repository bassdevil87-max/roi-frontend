"use client";

import { motion } from "framer-motion";
import { Microscope } from "lucide-react";
import { ConfidenceDot } from "@/components/ui/ConfidenceDot";
import { DATA_SOURCE_LABELS, type DataSource } from "@/types/roi";
import type { ProfitConfidence, InputConfidence } from "@/lib/confidence";
import { cn } from "@/lib/utils";

interface DataQualityCardProps {
  confidence: ProfitConfidence;
}

export function DataQualityCard({ confidence }: DataQualityCardProps) {
  const inputs: InputConfidence[] = [
    confidence.rent,
    confidence.price,
    confidence.property_tax,
    confidence.insurance,
    confidence.management,
    confidence.vacancy_reserve,
    confidence.capex_reserve,
    confidence.mortgage,
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card border-2 border-ink/10"
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <Microscope className="w-4 h-4 text-ink-secondary" strokeWidth={2} />
          <h3 className="text-base font-semibold">Data Quality</h3>
          <span className="pill bg-ink text-white text-[10px] uppercase tracking-wider">
            Expert
          </span>
        </div>
        <ConfidenceDot
          tier={confidence.tier}
          label={`${confidence.composite_score}/100`}
          showLabel
          size="md"
        />
      </div>

      <p className="text-xs text-ink-secondary mt-1 mb-3">
        {confidence.summary}
      </p>

      <div className="space-y-1.5">
        {inputs.map((input, i) => (
          <InputRow key={input.label} input={input} index={i} />
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-paper-stroke text-[11px] text-ink-tertiary leading-tight">
        <span className="font-semibold text-ink">Composite score:</span> worst of rent and price confidence (the two inputs with real-world API variance). Modeled inputs (insurance, vacancy %, CapEx %) don&apos;t drag the score down but are labeled honestly.
      </div>
    </motion.div>
  );
}

function InputRow({ input, index }: { input: InputConfidence; index: number }) {
  const sources = Array.isArray(input.source) ? input.source : [input.source];

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={cn(
        "flex items-start gap-2.5 p-2.5 rounded-lg",
        input.is_modeled ? "bg-paper-card" : "bg-paper-soft"
      )}
    >
      <div className="flex-shrink-0 mt-1">
        <ConfidenceDot
          tier={input.tier}
          explanation={input.explanation}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-ink">{input.label}</span>
            {input.is_modeled && (
              <span className="pill bg-paper-stroke text-ink-secondary text-[9px]">
                Modeled
              </span>
            )}
          </div>
          <span className="text-[12px] font-semibold tabular text-ink">{input.value}</span>
        </div>
        <div className="text-[11px] text-ink-secondary mt-0.5 leading-tight">
          {input.explanation}
        </div>
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {sources.map((src) => (
              <span
                key={src}
                className="pill bg-white border border-paper-stroke text-[10px] text-ink-tertiary font-medium"
              >
                {DATA_SOURCE_LABELS[src as DataSource] ?? src}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
