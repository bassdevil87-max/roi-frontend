"use client";

import { motion } from "framer-motion";
import { Droplets, Flame, ThermometerSun, Wind } from "lucide-react";
import { DATA_SOURCE_LABELS, type ClimateRisk, type ClimateHazard } from "@/types/roi";
import { cn } from "@/lib/utils";

interface ClimateRiskCardProps {
  climate: ClimateRisk;
}

const HAZARDS: Array<{
  key: keyof Pick<ClimateRisk, "flood" | "wildfire" | "heat" | "wind">;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
}> = [
  { key: "flood", label: "Flood", icon: Droplets, color: "text-signal" },
  { key: "wildfire", label: "Wildfire", icon: Flame, color: "text-danger" },
  { key: "heat", label: "Extreme Heat", icon: ThermometerSun, color: "text-warn" },
  { key: "wind", label: "Hurricane/Wind", icon: Wind, color: "text-ink-secondary" },
];

export function ClimateRiskCard({ climate }: ClimateRiskCardProps) {
  const providerLabel = DATA_SOURCE_LABELS[climate.source];

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-semibold">Climate Risk</h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Projected to 2050 · Data from {providerLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {HAZARDS.map((h, i) => (
          <HazardTile
            key={h.key}
            index={i}
            icon={<h.icon className={cn("w-4 h-4", h.color)} strokeWidth={2} />}
            label={h.label}
            hazard={climate[h.key]}
          />
        ))}
      </div>

      {/* FEMA zone callout */}
      <div className="mt-3 bg-paper-soft border border-paper-stroke rounded-xl p-3 flex items-start gap-2.5">
        <Droplets className="w-4 h-4 text-signal flex-shrink-0 mt-0.5" strokeWidth={2} />
        <div className="flex-1">
          <div className="text-[13px] font-semibold">
            FEMA Zone:{" "}
            <span className={climate.fema_high_risk ? "text-danger" : "text-ink"}>
              {climate.fema_zone}
            </span>
          </div>
          <div className="text-[11px] text-ink-secondary mt-0.5">
            {climate.fema_high_risk
              ? `High-risk zone. Flood insurance required: ~$${climate.flood_insurance_monthly_est}/mo`
              : "Low-to-moderate flood risk. Insurance not federally required."}
          </div>
          <div className="text-[10px] text-ink-tertiary mt-1 font-medium">
            Source: {DATA_SOURCE_LABELS[climate.fema_source]}
          </div>
        </div>
      </div>
    </div>
  );
}

function HazardTile({
  icon,
  label,
  hazard,
  index,
}: {
  icon: React.ReactNode;
  label: string;
  hazard: ClimateHazard;
  index: number;
}) {
  const tierColor =
    hazard.score >= 8 ? "bg-danger text-white" :
    hazard.score >= 6 ? "bg-warn text-white" :
    hazard.score >= 4 ? "bg-paper-card text-ink" :
    "bg-money-bg text-money";

  const tierLabel =
    hazard.tier === "severe" ? "Severe" :
    hazard.tier === "major" ? "Major" :
    hazard.tier === "moderate" ? "Moderate" :
    hazard.tier === "minor" ? "Minor" :
    "Minimal";

  // Fill the 10-segment bar proportionally
  const segments = Array.from({ length: 10 }).map((_, i) => i < hazard.score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-paper-soft border border-paper-stroke rounded-xl p-3"
    >
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs font-semibold text-ink">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="font-display text-xl font-semibold tabular">
          {hazard.score}
        </span>
        <span className="text-[10px] text-ink-tertiary">/10</span>
        <span className={cn("ml-auto pill text-[10px]", tierColor)}>{tierLabel}</span>
      </div>
      {/* 10-segment risk bar */}
      <div className="flex gap-0.5">
        {segments.map((filled, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1 rounded-sm transition-colors",
              filled
                ? hazard.score >= 8 ? "bg-danger" :
                  hazard.score >= 6 ? "bg-warn" :
                  hazard.score >= 4 ? "bg-ink" :
                  "bg-money"
                : "bg-paper-card"
            )}
          />
        ))}
      </div>
      {hazard.notes && (
        <div className="text-[10px] text-ink-tertiary mt-2 leading-tight">
          {hazard.notes}
        </div>
      )}
    </motion.div>
  );
}
