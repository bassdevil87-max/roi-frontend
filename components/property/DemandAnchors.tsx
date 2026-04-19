"use client";

import { motion } from "framer-motion";
import { AIInsight } from "@/components/ui/AIInsight";
import { GraduationCap, Hospital, Train, Building2, Briefcase, Plane } from "lucide-react";
import type { DemandAnchor } from "@/types/roi";

const ANCHOR_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  university: GraduationCap,
  hospital: Hospital,
  transit: Train,
  commercial: Briefcase,
  lifestyle: Building2,
  military_base: Building2,
  port: Plane,
};

interface DemandAnchorsProps {
  anchors: DemandAnchor[];
}

export function DemandAnchors({ anchors }: DemandAnchorsProps) {
  const structural = anchors.filter((a) => a.structural);
  const secondary = anchors.filter((a) => !a.structural);

  return (
    <div className="card">
      <div className="mb-3">
        <h3 className="text-base font-semibold mb-0.5">
          Why people choose to live here
        </h3>
        <div className="text-xs text-ink-secondary">
          Structural demand anchors within 10 miles
        </div>
      </div>

      <div className="space-y-3">
        {structural.map((anchor, i) => (
          <AnchorRow key={`${anchor.name}-${i}`} anchor={anchor} index={i} />
        ))}
        {secondary.length > 0 && (
          <>
            <div className="hairline my-3" />
            <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-medium mb-2">
              Also nearby
            </div>
            {secondary.map((anchor, i) => (
              <AnchorRow
                key={`${anchor.name}-sec-${i}`}
                anchor={anchor}
                index={i + structural.length}
                subtle
              />
            ))}
          </>
        )}
      </div>

      <div className="mt-4">
        <AIInsight>
          This area has consistent demand from students and workers, not just seasonal renters.
        </AIInsight>
      </div>
    </div>
  );
}

function AnchorRow({
  anchor,
  index,
  subtle = false,
}: {
  anchor: DemandAnchor;
  index: number;
  subtle?: boolean;
}) {
  const Icon = ANCHOR_ICONS[anchor.type] || Building2;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-start gap-3"
    >
      <div className={
        subtle
          ? "w-9 h-9 rounded-lg bg-paper-soft flex items-center justify-center flex-shrink-0 border border-paper-stroke"
          : "w-9 h-9 rounded-lg bg-signal-bg flex items-center justify-center flex-shrink-0"
      }>
        <Icon className={subtle ? "w-4 h-4 text-ink-tertiary" : "w-4 h-4 text-signal"} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-ink">{anchor.name}</div>
        <div className="text-[12px] text-ink-secondary mt-0.5">
          <span className="tabular">{anchor.distance_miles.toFixed(1)} miles</span>
          {anchor.type === "university" && " · 6,500 students need housing every year"}
          {anchor.type === "hospital" && " · 2,400 employees working shifts"}
          {anchor.type === "transit" && " · 1 hour to Penn Station. Commuters pay a premium"}
        </div>
      </div>
    </motion.div>
  );
}
