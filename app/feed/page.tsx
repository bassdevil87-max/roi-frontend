"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, SlidersHorizontal, Search, Pencil } from "lucide-react";
import { StatusBar } from "@/components/ui/StatusBar";
import { PropertyCard } from "@/components/feed/PropertyCard";
import { ExpertModeToggle } from "@/components/ui/ExpertModeToggle";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { mockFeedProperties } from "@/lib/mock-data";
import {
  readThesisFromStorage,
  scoreAgainstThesis,
  type LocalThesis,
} from "@/lib/thesis-match";

export default function FeedPage() {
  const [thesis, setThesis] = useState<LocalThesis | null>(null);

  // Read thesis after mount (sessionStorage is client-only)
  useEffect(() => {
    setThesis(readThesisFromStorage());
  }, []);

  // Score every property and split into passing / partial / excluded
  const { passing, partial, totalAnalyzed, thesisActive } = useMemo(() => {
    // If no thesis saved, treat everything as a match (default demo state)
    if (!thesis) {
      const scored = mockFeedProperties.map((p) => ({
        property: p,
        score: p.thesis_matches[0]?.match_score_pct ?? 75,
        passes: true,
        matched: [] as string[],
        partial: [] as string[],
        unmatched: [] as string[],
      }));
      return {
        passing: scored.sort((a, b) => b.score - a.score),
        partial: [],
        totalAnalyzed: mockFeedProperties.length,
        thesisActive: false,
      };
    }

    const scored = mockFeedProperties.map((p) => {
      const r = scoreAgainstThesis(p, thesis);
      return {
        property: {
          ...p,
          thesis_matches: [
            {
              thesis_id: "active",
              match_score_pct: r.score_pct,
              matched: r.matched,
              unmatched: r.unmatched,
              partial: r.partial,
            },
          ],
        },
        score: r.score_pct,
        passes: r.passes,
        matched: r.matched,
        partial: r.partial,
        unmatched: r.unmatched,
      };
    });

    // Passing: score >= 70 and no hard fails. Partial: rest with score > 30.
    const passes = scored.filter((s) => s.passes).sort((a, b) => b.score - a.score);
    const partials = scored
      .filter((s) => !s.passes && s.score > 30)
      .sort((a, b) => b.score - a.score);

    return {
      passing: passes,
      partial: partials,
      totalAnalyzed: mockFeedProperties.length,
      thesisActive: true,
    };
  }, [thesis]);

  return (
    <>
      <StatusBar />

      {/* Header */}
      <header className="px-5 pt-2 pb-4 bg-white">
        {/* Demo mode banner */}
        <DemoBanner className="mb-3" />

        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-medium mb-0.5">
              Your Feed
            </div>
            <h1 className="font-display text-[28px] font-semibold leading-tight">
              {passing.length} matching
              <br />
              {passing.length === 1 ? "property" : "properties"} today
            </h1>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-2">
            <button
              className="w-10 h-10 rounded-full bg-paper-card flex items-center justify-center hover:bg-paper-stroke transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              className="w-10 h-10 rounded-full bg-paper-card flex items-center justify-center hover:bg-paper-stroke transition-colors"
              aria-label="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Expert mode toggle */}
        <div className="flex justify-end mt-2">
          <ExpertModeToggle />
        </div>

        {/* Thesis summary bar */}
        {thesisActive && thesis && <ThesisSummary thesis={thesis} />}

        {/* Pipeline summary */}
        <div className="flex items-center gap-2 mt-3 p-3 bg-money-bg/40 border border-money/20 rounded-xl">
          <Sparkles className="w-4 h-4 text-money flex-shrink-0" strokeWidth={2} />
          <div className="text-[12px] text-ink leading-tight">
            <span className="font-semibold tabular">{totalAnalyzed}</span>{" "}
            listings analyzed →{" "}
            <span className="font-semibold text-money tabular">
              {passing.length}
            </span>{" "}
            {thesisActive ? "match your thesis" : "in feed"}
          </div>
        </div>
      </header>

      {/* Passing properties */}
      <section className="px-5 pt-2 space-y-4 bg-paper-soft pb-4">
        {passing.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-base font-semibold mb-1">
              No properties match your thesis right now.
            </div>
            <div className="text-sm text-ink-secondary max-w-xs mx-auto">
              Try widening your price range or adding states. We&apos;ll notify you as new listings match.
            </div>
            <Link
              href="/thesis/goal"
              className="inline-block mt-4 text-sm font-semibold text-signal hover:text-signal-dark"
            >
              Edit my thesis →
            </Link>
          </div>
        )}

        {passing.map((item, i) => (
          <PropertyCard
            key={item.property.listing.external_id}
            property={item.property}
            index={i}
          />
        ))}
      </section>

      {/* Partial matches below a divider */}
      {partial.length > 0 && (
        <section className="bg-paper-soft pt-4 pb-8">
          <div className="flex items-center gap-3 px-5 mb-3">
            <div className="h-px bg-paper-stroke flex-1" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary whitespace-nowrap">
              {partial.length} partial {partial.length === 1 ? "match" : "matches"}
            </span>
            <div className="h-px bg-paper-stroke flex-1" />
          </div>

          <div className="px-5 mb-3">
            <p className="text-xs text-ink-secondary text-center max-w-xs mx-auto">
              These don&apos;t fully match your thesis, but might still be worth a look.
            </p>
          </div>

          <div className="px-5 space-y-4">
            {partial.map((item, i) => (
              <div key={item.property.listing.external_id} className="relative">
                <motion.div
                  initial={{ opacity: 0.85 }}
                  animate={{ opacity: 1 }}
                  className="opacity-90"
                >
                  <PropertyCard property={item.property} index={i} />
                </motion.div>
                {/* Why it's not a full match — subtle annotation */}
                {item.unmatched.length > 0 && (
                  <div className="mx-3 mt-1 text-[11px] text-ink-tertiary">
                    <span className="font-medium">Not matching:</span>{" "}
                    {item.unmatched.slice(0, 2).join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function ThesisSummary({ thesis }: { thesis: LocalThesis }) {
  const narrowedCityCount = thesis.cities_by_state
    ? Object.values(thesis.cities_by_state).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  const statesDisplay =
    thesis.states.length === 0
      ? "Any state"
      : thesis.states.length <= 3
      ? thesis.states.join(", ")
      : `${thesis.states.slice(0, 2).join(", ")} +${thesis.states.length - 2}`;

  const geoDisplay =
    narrowedCityCount > 0
      ? `${statesDisplay} · ${narrowedCityCount} cit${narrowedCityCount === 1 ? "y" : "ies"}`
      : statesDisplay;

  const typeDisplay =
    thesis.property_type_pref === "single_family_only"
      ? "Single family"
      : thesis.property_type_pref === "multi_family_only"
      ? "Multi-family"
      : "Any type";

  const priceDisplay = `$${(thesis.min_price / 1000).toFixed(0)}k–${
    thesis.max_price >= 1_000_000
      ? `$${(thesis.max_price / 1_000_000).toFixed(1)}M`
      : `$${(thesis.max_price / 1000).toFixed(0)}k`
  }`;

  return (
    <div className="mt-3 flex items-center gap-2 p-3 bg-ink rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-white/60 uppercase tracking-wider font-medium mb-0.5">
          Active thesis
        </div>
        <div className="text-sm font-semibold text-white truncate">
          {geoDisplay} · {typeDisplay} · {priceDisplay}
        </div>
      </div>
      <Link
        href="/thesis/goal"
        className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <Pencil className="w-3 h-3" strokeWidth={2} />
        Edit
      </Link>
    </div>
  );
}
