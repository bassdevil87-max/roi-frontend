import type { FeedProperty } from "@/types/roi";
import { storage, STORAGE_KEYS } from "@/lib/storage";

// ───────────────────────────────────────────────────────────────────────────
// Thesis — the version stored locally during the onboarding flow.
// Narrower than the full backend Thesis type; captures what the builder collects.
// ───────────────────────────────────────────────────────────────────────────

export type ThesisGoal = "cash_flow" | "appreciation" | "balanced";
export type ThesisPropType = "single_family_only" | "multi_family_only" | "any";

export interface LocalThesis {
  goal: ThesisGoal;
  states: string[];
  cities_by_state?: Record<string, string[]>;   // Optional city narrowing per state
  property_type_pref: ThesisPropType;
  min_price: number;
  max_price: number;
}

// ───────────────────────────────────────────────────────────────────────────
// Weight table — mirrors the backend's scoring/thesis_match.py weights.
// Must sum to 1.0.
// ───────────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  geography: 0.30,
  price_range: 0.25,
  property_type: 0.20,
  cash_flow: 0.15,
  goal_alignment: 0.10,
} as const;

export interface MatchResult {
  score_pct: number;           // 0.0 – 100.0
  passes: boolean;             // true if score >= 70 AND no hard fails
  matched: string[];
  partial: string[];
  unmatched: string[];
}

// ───────────────────────────────────────────────────────────────────────────
// Score a property against a thesis. Returns gradient match, not binary.
// Mirrors the logic in the backend's scoring/thesis_match.py.
// ───────────────────────────────────────────────────────────────────────────

export function scoreAgainstThesis(
  property: FeedProperty,
  thesis: LocalThesis
): MatchResult {
  const matched: string[] = [];
  const partial: string[] = [];
  const unmatched: string[] = [];
  let weightedScore = 0;

  const { address, listing } = property;
  const lev = property.financials.leveraged;

  // ── Geography — state + optional city narrowing ──
  if (thesis.states.length === 0) {
    weightedScore += WEIGHTS.geography * 1.0;
    matched.push("geography");
  } else if (thesis.states.includes(address.state)) {
    // State matches. Now check if there's an optional city filter for this state.
    const cityFilter = thesis.cities_by_state?.[address.state] ?? [];
    if (cityFilter.length === 0) {
      // No city narrowing — full credit for state match
      weightedScore += WEIGHTS.geography * 1.0;
      matched.push(`geography (${address.state})`);
    } else if (cityFilter.includes(address.city)) {
      // City explicitly in the filter — full credit
      weightedScore += WEIGHTS.geography * 1.0;
      matched.push(`geography (${address.city}, ${address.state})`);
    } else {
      // State matches but city is outside the narrowing — partial credit
      weightedScore += WEIGHTS.geography * 0.5;
      partial.push(`geography (${address.city} not in city filter for ${address.state})`);
    }
  } else {
    unmatched.push(`geography (${address.state} not in thesis)`);
  }

  // ── Price range ──
  const price = listing.price;
  if (price >= thesis.min_price && price <= thesis.max_price) {
    weightedScore += WEIGHTS.price_range * 1.0;
    matched.push("price_range");
  } else if (price < thesis.min_price) {
    // Under budget — partial (not a hard fail)
    weightedScore += WEIGHTS.price_range * 0.5;
    partial.push(`price_range (under min by $${(thesis.min_price - price).toLocaleString()})`);
  } else {
    // Over budget — gradient drop off
    const overshoot = (price - thesis.max_price) / thesis.max_price;
    if (overshoot <= 0.1) {
      weightedScore += WEIGHTS.price_range * 0.7;
      partial.push(`price_range (${Math.round(overshoot * 100)}% over max)`);
    } else if (overshoot <= 0.25) {
      weightedScore += WEIGHTS.price_range * 0.3;
      partial.push(`price_range (${Math.round(overshoot * 100)}% over max)`);
    } else {
      unmatched.push(`price_range (${Math.round(overshoot * 100)}% over max)`);
    }
  }

  // ── Property type ──
  const type = listing.property_type;
  const isSingleFamily = ["single_family", "condo", "townhouse"].includes(type);
  const isMultiFamily = ["duplex", "triplex", "fourplex", "multi_family_5_plus"].includes(type);

  if (thesis.property_type_pref === "any") {
    weightedScore += WEIGHTS.property_type * 1.0;
    matched.push("property_type");
  } else if (thesis.property_type_pref === "single_family_only" && isSingleFamily) {
    weightedScore += WEIGHTS.property_type * 1.0;
    matched.push("property_type");
  } else if (thesis.property_type_pref === "multi_family_only" && isMultiFamily) {
    weightedScore += WEIGHTS.property_type * 1.0;
    matched.push("property_type");
  } else {
    unmatched.push(`property_type (${type} vs ${thesis.property_type_pref})`);
  }

  // ── Cash flow (always rewarded if positive) ──
  if (lev && lev.monthly_cash_flow > 200) {
    weightedScore += WEIGHTS.cash_flow * 1.0;
    matched.push(`cash_flow ($${Math.round(lev.monthly_cash_flow)}/mo)`);
  } else if (lev && lev.monthly_cash_flow > 0) {
    weightedScore += WEIGHTS.cash_flow * 0.6;
    partial.push(`cash_flow (thin: $${Math.round(lev.monthly_cash_flow)}/mo)`);
  } else if (lev && lev.monthly_cash_flow <= 0) {
    unmatched.push("cash_flow (negative)");
  }

  // ── Goal alignment ──
  if (lev) {
    if (thesis.goal === "cash_flow") {
      // Reward high cash-on-cash return
      const coc = lev.cash_on_cash_return_pct ?? 0;
      if (coc >= 10) {
        weightedScore += WEIGHTS.goal_alignment * 1.0;
        matched.push(`goal_alignment (${coc.toFixed(1)}% CoC)`);
      } else if (coc >= 6) {
        weightedScore += WEIGHTS.goal_alignment * 0.7;
        partial.push(`goal_alignment (${coc.toFixed(1)}% CoC)`);
      } else {
        partial.push(`goal_alignment (${coc.toFixed(1)}% CoC — below ideal)`);
      }
    } else if (thesis.goal === "appreciation") {
      // Reward high projected 3-year growth
      const growth = property.projection_3y
        ? (property.projection_3y - listing.price) / listing.price
        : 0;
      if (growth >= 0.30) {
        weightedScore += WEIGHTS.goal_alignment * 1.0;
        matched.push(`goal_alignment (+${Math.round(growth * 100)}% 3yr)`);
      } else if (growth >= 0.15) {
        weightedScore += WEIGHTS.goal_alignment * 0.7;
        partial.push(`goal_alignment (+${Math.round(growth * 100)}% 3yr)`);
      } else {
        partial.push(`goal_alignment (weak appreciation)`);
      }
    } else {
      // Balanced — moderate reward for anything positive
      weightedScore += WEIGHTS.goal_alignment * 0.8;
      matched.push("goal_alignment (balanced)");
    }
  }

  const score_pct = Math.round(weightedScore * 1000) / 10;   // 1 decimal place

  // A property "passes" the thesis if it scores >= 70% and has no hard unmatched criteria
  const hardFailCriteria = unmatched.filter(
    (u) => u.startsWith("geography") || u.startsWith("property_type")
  );
  const passes = score_pct >= 70 && hardFailCriteria.length === 0;

  return { score_pct, passes, matched, partial, unmatched };
}

// ───────────────────────────────────────────────────────────────────────────
// Attach match result to a property for the feed and replace thesis_matches.
// Returns a new property (does not mutate input).
// ───────────────────────────────────────────────────────────────────────────

export function applyThesis(
  properties: FeedProperty[],
  thesis: LocalThesis,
  thesisId = "active_thesis"
): Array<FeedProperty & { _match: MatchResult }> {
  return properties.map((p) => {
    const match = scoreAgainstThesis(p, thesis);
    return {
      ...p,
      thesis_matches: [
        {
          thesis_id: thesisId,
          match_score_pct: match.score_pct,
          matched: match.matched,
          unmatched: match.unmatched,
          partial: match.partial,
        },
      ],
      _match: match,
    };
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Read thesis from local storage (client-side only).
// Returns null if no thesis has been saved yet.
// ───────────────────────────────────────────────────────────────────────────

export function readThesisFromStorage(): LocalThesis | null {
  const goal = storage.get<ThesisGoal>(STORAGE_KEYS.thesis_goal);
  if (!goal) return null;

  const states = storage.get<string[]>(STORAGE_KEYS.thesis_states) ?? [];
  const cities_raw = storage.get<Record<string, string[]>>(STORAGE_KEYS.thesis_cities);
  const propType = storage.get<ThesisPropType>(STORAGE_KEYS.thesis_prop_type) ?? "any";
  const minPrice = storage.get<number>(STORAGE_KEYS.thesis_min_price) ?? 0;
  const maxPrice = storage.get<number>(STORAGE_KEYS.thesis_max_price) ?? 10_000_000;

  // Only keep cities_by_state if there are actual non-empty arrays
  let cities_by_state: Record<string, string[]> | undefined;
  if (
    cities_raw &&
    typeof cities_raw === "object" &&
    Object.values(cities_raw).some((arr) => Array.isArray(arr) && arr.length > 0)
  ) {
    cities_by_state = cities_raw;
  }

  return {
    goal,
    states,
    cities_by_state,
    property_type_pref: propType,
    min_price: minPrice,
    max_price: maxPrice,
  };
}

export function writeThesisToStorage(thesis: Partial<LocalThesis>): void {
  if (thesis.goal) storage.set(STORAGE_KEYS.thesis_goal, thesis.goal);
  if (thesis.states) storage.set(STORAGE_KEYS.thesis_states, thesis.states);
  if (thesis.cities_by_state) storage.set(STORAGE_KEYS.thesis_cities, thesis.cities_by_state);
  if (thesis.property_type_pref) storage.set(STORAGE_KEYS.thesis_prop_type, thesis.property_type_pref);
  if (thesis.min_price != null) storage.set(STORAGE_KEYS.thesis_min_price, thesis.min_price);
  if (thesis.max_price != null) storage.set(STORAGE_KEYS.thesis_max_price, thesis.max_price);
  // Mark thesis as completed so /feed can detect a returning user
  storage.set(STORAGE_KEYS.thesis_completed, true);
}

/**
 * Completely clear the saved thesis — used when user wants to start over.
 */
export function clearThesisFromStorage(): void {
  storage.remove(STORAGE_KEYS.thesis_goal);
  storage.remove(STORAGE_KEYS.thesis_states);
  storage.remove(STORAGE_KEYS.thesis_cities);
  storage.remove(STORAGE_KEYS.thesis_prop_type);
  storage.remove(STORAGE_KEYS.thesis_min_price);
  storage.remove(STORAGE_KEYS.thesis_max_price);
  storage.remove(STORAGE_KEYS.thesis_completed);
}
