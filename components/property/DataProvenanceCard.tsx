"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Database } from "lucide-react";
import { DATA_SOURCE_LABELS, type FeedProperty, type DataSource } from "@/types/roi";
import { cn } from "@/lib/utils";

interface DataProvenanceCardProps {
  property: FeedProperty;
}

interface SourceSummary {
  source: DataSource;
  dataPoints: string[];
  confidence: "high" | "medium" | "low" | "unavailable";
}

export function DataProvenanceCard({ property }: DataProvenanceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const summary = buildProvenanceSummary(property);
  const available = summary.filter((s) => s.confidence !== "unavailable");
  const unavailable = summary.filter((s) => s.confidence === "unavailable");

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-1.5">
            <Database className="w-4 h-4 text-ink-secondary" strokeWidth={2} />
            Data Sources
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Every number is traceable to a public or contracted data source
          </p>
        </div>
      </div>

      {/* Pill cloud — compact view of all sources */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {available.map((s) => (
          <div
            key={s.source}
            className="pill bg-money-bg text-money"
            title={s.dataPoints.join(", ")}
          >
            {DATA_SOURCE_LABELS[s.source]}
          </div>
        ))}
        {unavailable.length > 0 && (
          <div className="pill bg-paper-card text-ink-tertiary">
            +{unavailable.length} not available
          </div>
        )}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 mt-1 text-sm font-medium border-t border-paper-stroke"
      >
        <span>See what each source provides</span>
        <ChevronDown
          className={cn("w-4 h-4 transition-transform text-ink-secondary", expanded && "rotate-180")}
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
            <div className="space-y-2 pt-1">
              {[...available, ...unavailable].map((s, i) => (
                <SourceRow key={s.source} summary={s} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SourceRow({ summary, index }: { summary: SourceSummary; index: number }) {
  const confidenceDot =
    summary.confidence === "high" ? "bg-money" :
    summary.confidence === "medium" ? "bg-signal" :
    summary.confidence === "low" ? "bg-warn" :
    "bg-paper-stroke";

  const confidenceLabel =
    summary.confidence === "high" ? "Verified" :
    summary.confidence === "medium" ? "Modeled" :
    summary.confidence === "low" ? "Estimated" :
    "Not available";

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={cn(
        "flex items-start gap-3 py-2 px-3 rounded-lg",
        summary.confidence === "unavailable" ? "opacity-50" : "bg-paper-soft"
      )}
    >
      <div className={cn("flex-shrink-0 mt-1.5 w-2 h-2 rounded-full", confidenceDot)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold text-ink">
            {DATA_SOURCE_LABELS[summary.source]}
          </span>
          <span className="text-[10px] text-ink-tertiary font-medium uppercase tracking-wider">
            {confidenceLabel}
          </span>
        </div>
        <div className="text-[11px] text-ink-secondary mt-0.5 leading-tight">
          {summary.dataPoints.join(" · ")}
        </div>
      </div>
    </motion.div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Build a map of source → data points surfaced in the UI for this property
// ───────────────────────────────────────────────────────────────────────────

function buildProvenanceSummary(p: FeedProperty): SourceSummary[] {
  const map = new Map<DataSource, SourceSummary>();
  const add = (
    source: DataSource,
    dataPoint: string,
    confidence: "high" | "medium" | "low" | "unavailable" = "high"
  ) => {
    const existing = map.get(source);
    if (existing) {
      if (!existing.dataPoints.includes(dataPoint)) existing.dataPoints.push(dataPoint);
      // Keep highest confidence level
      const rank = { high: 3, medium: 2, low: 1, unavailable: 0 };
      if (rank[confidence] > rank[existing.confidence]) existing.confidence = confidence;
    } else {
      map.set(source, { source, dataPoints: [dataPoint], confidence });
    }
  };

  // ─── Listing source ────────────────────────────────────────────────────
  add(p.listing.source, "Listing price", "high");
  add(p.listing.source, "Property type", "high");
  add(p.listing.source, "Bedrooms, bathrooms, sqft", "high");
  add(p.listing.source, "Days on market", "high");
  Object.keys(p.listing.price_sources).forEach((src) => {
    if (src !== p.listing.source) add(src as DataSource, "Price validation", "high");
  });

  // ─── Rent blend ────────────────────────────────────────────────────────
  p.rent_estimate.units[0]?.sources_breakdown.forEach((s) => {
    if (s.is_available) {
      add(s.source, `Rent estimate ($${s.rent_estimate}/mo)`, "high");
    } else {
      add(s.source, "Rent estimate", "unavailable");
    }
  });

  // ─── Property tax ──────────────────────────────────────────────────────
  if (p.financials.leveraged) {
    add(p.financials.leveraged.operating_expenses.property_tax_source, "Property tax assessment", "high");
  }

  // ─── HUD / Section 8 ──────────────────────────────────────────────────
  if (p.section8.flag_triggered) {
    add("hud", "Fair Market Rent & voucher waitlist", "high");
  } else {
    add("hud", "Fair Market Rent check", "high");
  }

  // ─── FEMA ──────────────────────────────────────────────────────────────
  add(p.climate_risk.fema_source, `FEMA flood zone ${p.climate_risk.fema_zone}`, "high");

  // ─── Climate (First Street / ClimateCheck) ────────────────────────────
  add(p.climate_risk.source, "Flood, wildfire, heat, wind risk scores", "high");

  // ─── Census ACS ────────────────────────────────────────────────────────
  add(p.vacancy.source, "ZIP vacancy rate, median rent, median income", "high");

  // ─── Condition signals ────────────────────────────────────────────────
  p.condition.signals.forEach((sig) => {
    add(sig.source, sig.name, sig.fired ? "high" : "unavailable");
  });

  // ─── Demand anchors ────────────────────────────────────────────────────
  if (p.demand_anchors.length > 0) {
    add("google_maps", `${p.demand_anchors.length} demand anchors nearby`, "high");
  }

  // ─── Permits ───────────────────────────────────────────────────────────
  if (p.permits.length > 0) {
    add("shovels", `${p.permits.length} building permits`, "high");
  } else {
    add("shovels", "Permit history check", "medium");
  }

  // ─── HouseCanary AVM ───────────────────────────────────────────────────
  if (p.housecanary_avm) {
    add("housecanary", `AVM $${p.housecanary_avm.value_estimate.toLocaleString()}`, "high");
  } else {
    add("housecanary", "Property valuation AVM", "unavailable");
  }

  // ─── NeighborhoodScout ────────────────────────────────────────────────
  if (p.appreciation) {
    add("neighborhoodscout", `Appreciation forecast, neighborhood grade ${p.appreciation.neighborhood_grade}`, "medium");
  } else {
    add("neighborhoodscout", "Appreciation forecast", "unavailable");
  }

  // ─── Regrid / USPS ────────────────────────────────────────────────────
  if (p.usps_vacancy) {
    add("regrid", "USPS mail-delivery vacancy data", "high");
  } else {
    add("regrid", "USPS vacancy data", "unavailable");
  }

  // ─── Eviction Lab ─────────────────────────────────────────────────────
  if (p.eviction_data) {
    add("eviction_lab", `${p.eviction_data.filings_per_1000_renters.toFixed(1)} filings per 1000 renters`, "high");
  } else {
    add("eviction_lab", "Eviction filing rate", "unavailable");
  }

  // ─── Lightcast ────────────────────────────────────────────────────────
  if (p.job_market) {
    add("lightcast", `${p.job_market.active_postings.toLocaleString()} active job postings`, "medium");
  } else {
    add("lightcast", "Job posting velocity", "unavailable");
  }

  // Sort: available first, then alphabetical
  return Array.from(map.values()).sort((a, b) => {
    if (a.confidence === "unavailable" && b.confidence !== "unavailable") return 1;
    if (a.confidence !== "unavailable" && b.confidence === "unavailable") return -1;
    return DATA_SOURCE_LABELS[a.source].localeCompare(DATA_SOURCE_LABELS[b.source]);
  });
}
