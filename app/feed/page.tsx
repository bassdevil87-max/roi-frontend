"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, SlidersHorizontal, Search, Pencil } from "lucide-react";
import { StatusBar } from "@/components/ui/StatusBar";
import { PropertyCard } from "@/components/feed/PropertyCard";
import { ExpertModeToggle } from "@/components/ui/ExpertModeToggle";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { FeedbackWidget } from "@/components/ui/FeedbackWidget";
import { SearchFilterBar } from "@/components/ui/SearchFilterBar";
import { ComingSoonModal } from "@/components/ui/ComingSoonModal";
import { BackToTopButton } from "@/components/ui/BackToTopButton";
import { ExpertModeHint } from "@/components/ui/ExpertModeHint";
import { mockFeedProperties } from "@/lib/mock-data";
import {
  readThesisFromStorage,
  scoreAgainstThesis,
  type LocalThesis,
} from "@/lib/thesis-match";
import { storage, STORAGE_KEYS } from "@/lib/storage";

export default function FeedPage() {
  const [thesis, setThesis] = useState<LocalThesis | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterComingSoonOpen, setFilterComingSoonOpen] = useState(false);

  // Read thesis + restore scroll position after mount (storage is client-only)
  useEffect(() => {
    setThesis(readThesisFromStorage());

    // Restore scroll position if the user is returning from a property page
    const savedY = storage.get<number>(STORAGE_KEYS.feed_scroll_y);
    if (typeof savedY === "number" && savedY > 0) {
      // Wait a tick for the cards to render before scrolling
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: "auto" });
        // Clear so next visit starts at top — only restore once
        storage.remove(STORAGE_KEYS.feed_scroll_y);
      });
    }

    // Save scroll position whenever a card link is clicked
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a[href^="/property/"]')) {
        storage.set(STORAGE_KEYS.feed_scroll_y, window.scrollY);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Score every property and split into passing / partial / excluded
  const { passing: allPassing, partial: allPartial, totalAnalyzed, thesisActive } = useMemo(() => {
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

  // Apply search filter on top of thesis filtering — address/city/state match
  const { passing, partial } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { passing: allPassing, partial: allPartial };
    const matches = (item: typeof allPassing[number]) => {
      const a = item.property.address;
      return (
        a.street.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.state.toLowerCase().includes(q) ||
        a.zip_code?.toLowerCase().includes(q) ||
        `${a.city}, ${a.state}`.toLowerCase().includes(q)
      );
    };
    return {
      passing: allPassing.filter(matches),
      partial: allPartial.filter(matches),
    };
  }, [allPassing, allPartial, searchQuery]);

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
              onClick={() => setSearchOpen(!searchOpen)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                searchOpen ? "bg-ink text-white" : "bg-paper-card hover:bg-paper-stroke"
              }`}
              aria-label="Search"
              aria-pressed={searchOpen}
            >
              <Search className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => setFilterComingSoonOpen(true)}
              className="w-10 h-10 rounded-full bg-paper-card flex items-center justify-center hover:bg-paper-stroke transition-colors"
              aria-label="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Search bar — expands below when search is open */}
        <SearchFilterBar
          open={searchOpen}
          value={searchQuery}
          onChange={setSearchQuery}
          onClose={() => setSearchOpen(false)}
        />

        {/* Expert mode toggle */}
        <div className="flex justify-end mt-2">
          <ExpertModeToggle />
        </div>

        {/* First-run hint pointing at expert mode */}
        <div className="mt-2">
          <ExpertModeHint />
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
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="py-10 px-4 bg-white border border-paper-stroke rounded-2xl text-center"
          >
            <div className="w-14 h-14 rounded-full bg-paper-card flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-ink-tertiary" strokeWidth={2} />
            </div>
            <div className="font-display text-[18px] font-semibold mb-1.5">
              Nothing matches yet
            </div>
            <div className="text-[13px] text-ink-secondary max-w-[280px] mx-auto leading-relaxed mb-5">
              {partial.length > 0
                ? `We found ${partial.length} partial match${partial.length === 1 ? "" : "es"} below. Want to widen your thesis to see more?`
                : "Try widening your price range, adding more states, or changing property type to see more listings."}
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <Link
                href="/thesis/goal"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-ink text-white text-[12px] font-semibold hover:bg-ink/90 transition-colors"
              >
                Edit thesis
              </Link>
              <Link
                href="/thesis/budget"
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-paper-card text-ink text-[12px] font-semibold hover:bg-paper-stroke transition-colors"
              >
                Widen budget
              </Link>
            </div>
          </motion.div>
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

      {/* Feedback widget — lives at bottom-right, no sticky CTA on feed */}
      <FeedbackWidget context="feed" bottomOffset={24} />

      {/* Back-to-top — shown after 600px scroll, sits above feedback FAB */}
      <BackToTopButton bottomOffset={84} />

      {/* Filters coming soon modal */}
      <ComingSoonModal
        open={filterComingSoonOpen}
        onClose={() => setFilterComingSoonOpen(false)}
        title="Advanced filters"
        description="Filters give you finer control over which properties show up in your feed — beyond what your thesis alone can do."
        features={[
          "Filter by bedroom/bathroom count",
          "Filter by days on market",
          "Filter by condition (strong / moderate / unknown)",
          "Filter by Section 8 eligibility",
          "Save multiple filter presets",
        ]}
      />
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
