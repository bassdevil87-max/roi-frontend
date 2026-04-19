"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bed, Bath, Ruler, Heart, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ConfidenceDot } from "@/components/ui/ConfidenceDot";
import { formatMoney, formatPriceFull } from "@/lib/utils";
import { calculateProfitConfidence } from "@/lib/confidence";
import { useExpertMode } from "@/context/ExpertMode";
import { useSavedProperties } from "@/lib/useSavedProperties";
import { cn } from "@/lib/utils";
import { DATA_SOURCE_LABELS } from "@/types/roi";
import type { FeedProperty } from "@/types/roi";

interface PropertyCardProps {
  property: FeedProperty;
  index?: number;
}

export function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const { expertMode } = useExpertMode();
  const { isSaved, toggle, isMounted } = useSavedProperties();
  const lev = property.financials.leveraged;
  const confidence = useMemo(() => calculateProfitConfidence(property), [property]);

  const saved = isMounted && isSaved(property.listing.external_id);

  const bestMatch = property.thesis_matches.reduce(
    (max, m) => (m.match_score_pct > max ? m.match_score_pct : max),
    0
  );

  // Cap stagger animation at 6 cards — further cards just fade in on scroll
  // via whileInView, which only triggers when they near the viewport.
  const useImmediate = index < 6;
  const staggerDelay = useImmediate ? index * 0.06 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      {...(useImmediate
        ? { animate: { opacity: 1, y: 0 } }
        : {
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-50px" },
          })}
      transition={{ duration: 0.35, delay: staggerDelay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/property/${property.listing.external_id}`}
        className="block"
      >
        <article className="bg-white rounded-card overflow-hidden border border-paper-stroke hover:shadow-cardHover transition-shadow group">
          {/* Image */}
          <div className="relative aspect-[16/10] overflow-hidden bg-paper-card">
            {property.hero_image && (
              <Image
                src={property.hero_image}
                alt={property.address.street}
                fill
                sizes="(max-width: 430px) 100vw, 430px"
                className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
            )}

            {/* Top-left: thesis match badge */}
            <div className="absolute top-3 left-3">
              <div className="bg-white/95 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-money" />
                <span className="text-[11px] font-semibold tabular">
                  {bestMatch.toFixed(0)}% match
                </span>
              </div>
            </div>

            {/* Top-right: save heart */}
            <button
              className={cn(
                "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all",
                saved
                  ? "bg-danger/95 backdrop-blur-md hover:bg-danger"
                  : "bg-white/95 backdrop-blur-md hover:bg-white"
              )}
              aria-label={saved ? "Unsave property" : "Save property"}
              aria-pressed={saved}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(property.listing.external_id);
              }}
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors",
                  saved ? "fill-white text-white" : "text-ink"
                )}
                strokeWidth={2}
              />
            </button>

            {/* Bottom: monthly profit chip + confidence dot */}
            {lev && (
              <div className="absolute bottom-3 left-3 bg-ink/90 backdrop-blur-md rounded-lg px-3 py-1.5 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-money-light" strokeWidth={2.5} />
                <span className="text-white text-xs font-semibold tabular">
                  {formatMoney(lev.monthly_cash_flow, { sign: true })}/mo
                </span>
                <div className="w-px h-3 bg-white/20" />
                <ConfidenceDot
                  tier={confidence.tier}
                  explanation={confidence.summary}
                />
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl font-semibold tabular leading-tight truncate">
                  {formatPriceFull(property.listing.price)}
                </div>
                <div className="text-[13px] text-ink-secondary mt-0.5 truncate">
                  {property.address.street}, {property.address.city},{" "}
                  {property.address.state}
                </div>
              </div>
              {property.section8.flag_triggered && (
                <Badge variant="section8" className="flex-shrink-0 ml-2">
                  Section 8
                </Badge>
              )}
            </div>

            {/* Stats strip */}
            <div className="flex items-center gap-3 text-[12px] text-ink-secondary mt-3 pt-3 border-t border-paper-stroke">
              <StatItem icon={<Bed className="w-3.5 h-3.5" strokeWidth={2} />}>
                {property.listing.bedrooms}
              </StatItem>
              <StatItem icon={<Bath className="w-3.5 h-3.5" strokeWidth={2} />}>
                {property.listing.bathrooms}
              </StatItem>
              {property.listing.sqft && (
                <StatItem icon={<Ruler className="w-3.5 h-3.5" strokeWidth={2} />}>
                  {property.listing.sqft.toLocaleString()} sqft
                </StatItem>
              )}
              {lev?.cash_on_cash_return_pct != null && (
                <div className="ml-auto text-money font-semibold tabular text-[12px]">
                  {lev.cash_on_cash_return_pct.toFixed(1)}% CoC
                </div>
              )}
            </div>

            {/* Expert-mode-only info strip */}
            {expertMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-dashed border-ink/15 space-y-1.5"
              >
                <ExpertRow
                  label="Price"
                  tier={confidence.price.tier}
                  detail={confidence.price.explanation}
                />
                <ExpertRow
                  label="Rent"
                  tier={confidence.rent.tier}
                  detail={confidence.rent.explanation}
                />
                <div className="flex items-center justify-between text-[10px] pt-1">
                  <span className="text-ink-tertiary font-medium uppercase tracking-wider">
                    Primary source
                  </span>
                  <span className="font-semibold text-ink tabular">
                    {DATA_SOURCE_LABELS[property.listing.source]}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

function StatItem({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-ink-secondary font-medium tabular">
      {icon}
      {children}
    </span>
  );
}

function ExpertRow({
  label,
  tier,
  detail,
}: {
  label: string;
  tier: "high" | "medium" | "low";
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className="text-ink-tertiary font-medium uppercase tracking-wider w-10 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <ConfidenceDot tier={tier} />
      <span className="text-ink-secondary leading-tight flex-1 min-w-0">{detail}</span>
    </div>
  );
}
