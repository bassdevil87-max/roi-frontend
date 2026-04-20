"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowLeftRight, ExternalLink, MapPin } from "lucide-react";
import { StatusBar } from "@/components/ui/StatusBar";
import { TradeoffSummary } from "@/components/compare/TradeoffSummary";
import { CompareSection } from "@/components/compare/CompareSection";
import { FeedbackWidget } from "@/components/ui/FeedbackWidget";
import { compareProperties } from "@/lib/compare";
import { formatPriceFull } from "@/lib/utils";
import type { FeedProperty } from "@/types/roi";

interface CompareClientProps {
  propertyA: FeedProperty;
  propertyB: FeedProperty;
}

export function CompareClient({ propertyA, propertyB }: CompareClientProps) {
  const router = useRouter();
  const result = useMemo(
    () => compareProperties(propertyA, propertyB),
    [propertyA, propertyB]
  );

  const handleSwap = () => {
    router.replace(
      `/compare/${propertyB.listing.external_id}/${propertyA.listing.external_id}`
    );
  };

  return (
    <>
      <StatusBar />

      {/* Header */}
      <header className="px-5 pt-2 pb-3 bg-white border-b border-paper-stroke sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-paper-card transition-colors -ml-2"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-semibold">
              Compare
            </div>
            <div className="text-[13px] font-semibold">
              Property A · vs · B
            </div>
          </div>
          <button
            onClick={handleSwap}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-paper-card transition-colors -mr-2"
            aria-label="Swap properties"
          >
            <ArrowLeftRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Property cards row */}
        <div className="grid grid-cols-2 gap-2">
          <PropertyCompareCard label="A" property={propertyA} />
          <PropertyCompareCard label="B" property={propertyB} />
        </div>
      </header>

      {/* Body */}
      <div className="px-5 pt-4 pb-24 space-y-3 bg-paper-soft">
        <TradeoffSummary result={result} />

        {result.sections.map((section, i) => (
          <CompareSection
            key={section.label}
            label={section.label}
            metrics={section.metrics}
            index={i}
          />
        ))}

        {/* Per-property deep links */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link
            href={`/property/${propertyA.listing.external_id}`}
            className="flex items-center justify-center gap-1.5 h-10 rounded-full bg-white border border-paper-stroke text-[12px] font-semibold text-ink hover:bg-paper-soft transition-colors"
          >
            <span>See full A</span>
            <ExternalLink className="w-3 h-3" strokeWidth={2.2} />
          </Link>
          <Link
            href={`/property/${propertyB.listing.external_id}`}
            className="flex items-center justify-center gap-1.5 h-10 rounded-full bg-white border border-paper-stroke text-[12px] font-semibold text-ink hover:bg-paper-soft transition-colors"
          >
            <span>See full B</span>
            <ExternalLink className="w-3 h-3" strokeWidth={2.2} />
          </Link>
        </div>

        <div className="text-[11px] text-ink-tertiary text-center pt-4 leading-relaxed">
          Tradeoff analysis is deterministic — same inputs always produce the same takeaway.
          When we integrate live AI, this will incorporate user&apos;s specific thesis and goals.
        </div>
      </div>

      <FeedbackWidget context={`compare:${propertyA.listing.external_id}_${propertyB.listing.external_id}`} bottomOffset={24} />
    </>
  );
}

// ─── Property header card — compact summary shown at top of compare page ────

function PropertyCompareCard({
  label,
  property,
}: {
  label: "A" | "B";
  property: FeedProperty;
}) {
  const lev = property.financials.leveraged;
  const profitClass = lev && lev.monthly_cash_flow > 0 ? "text-money" : "text-danger";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative bg-white rounded-xl border border-paper-stroke overflow-hidden"
    >
      <div className="relative aspect-[16/9] bg-paper-card">
        {property.hero_image && (
          <Image
            src={property.hero_image}
            alt={property.address.street}
            fill
            sizes="220px"
            className="object-cover"
          />
        )}
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-ink/90 backdrop-blur-md text-white font-display font-semibold text-xs flex items-center justify-center">
          {label}
        </div>
      </div>
      <div className="p-2.5">
        <div className="font-display text-[14px] font-semibold tabular leading-tight truncate">
          {formatPriceFull(property.listing.price)}
        </div>
        <div className="flex items-center gap-0.5 text-[10px] text-ink-secondary leading-tight truncate mt-0.5">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" strokeWidth={2} />
          <span className="truncate">
            {property.address.city}, {property.address.state}
          </span>
        </div>
        {lev && (
          <div className={`text-[11px] font-semibold tabular mt-1 ${profitClass}`}>
            {lev.monthly_cash_flow >= 0 ? "+" : ""}${Math.round(lev.monthly_cash_flow).toLocaleString()}/mo
          </div>
        )}
      </div>
    </motion.div>
  );
}
