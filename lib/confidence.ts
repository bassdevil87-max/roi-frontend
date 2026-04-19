import type { FeedProperty, DataSource } from "@/types/roi";

// ───────────────────────────────────────────────────────────────────────────
// Confidence tiers — the user-facing traffic light categories
// ───────────────────────────────────────────────────────────────────────────

export type ConfidenceTier = "high" | "medium" | "low";

export interface InputConfidence {
  label: string;
  tier: ConfidenceTier;
  source: DataSource | DataSource[];       // Single source or multi-source blend
  value: string;                              // Human-readable value ("$2,100/mo")
  explanation: string;                        // Why this tier
  is_modeled: boolean;                        // True if formula-derived (insurance, vacancy %, capex %)
}

export interface ProfitConfidence {
  tier: ConfidenceTier;
  composite_score: number;                    // 0-100
  rent: InputConfidence;
  price: InputConfidence;
  property_tax: InputConfidence;
  insurance: InputConfidence;
  management: InputConfidence;
  vacancy_reserve: InputConfidence;
  capex_reserve: InputConfidence;
  mortgage: InputConfidence;
  weakest_link: string;                      // Which input dragged the score down
  summary: string;                            // One-sentence explanation
}

// ───────────────────────────────────────────────────────────────────────────
// Tier ranking for math (higher = better)
// ───────────────────────────────────────────────────────────────────────────

const TIER_RANK: Record<ConfidenceTier, number> = { high: 3, medium: 2, low: 1 };
const TIER_SCORE: Record<ConfidenceTier, number> = { high: 95, medium: 70, low: 40 };

function worstTier(tiers: ConfidenceTier[]): ConfidenceTier {
  return tiers.reduce((worst, t) =>
    TIER_RANK[t] < TIER_RANK[worst] ? t : worst
  , "high" as ConfidenceTier);
}

// ───────────────────────────────────────────────────────────────────────────
// Rent confidence — based on spread across sources (tight = high)
// ───────────────────────────────────────────────────────────────────────────

export function calculateRentConfidence(property: FeedProperty): InputConfidence {
  const unit = property.rent_estimate.units[0];
  const available = unit?.sources_breakdown.filter((s) => s.is_available && s.rent_estimate != null) ?? [];

  if (available.length === 0) {
    return {
      label: "Rent estimate",
      tier: "low",
      source: [],
      value: `$${property.rent_estimate.mid.toLocaleString()}/mo`,
      explanation: "No live rent data sources available",
      is_modeled: false,
    };
  }

  if (available.length === 1) {
    return {
      label: "Rent estimate",
      tier: "medium",
      source: available[0].source,
      value: `$${property.rent_estimate.mid.toLocaleString()}/mo`,
      explanation: `Only 1 source (${available[0].source}) returned data — can't cross-validate`,
      is_modeled: false,
    };
  }

  // Calculate spread across available sources
  const values = available.map((s) => s.rent_estimate!);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const spread_pct = median > 0 ? ((max - min) / median) * 100 : 0;

  const tier: ConfidenceTier = spread_pct <= 4 ? "high" : spread_pct <= 10 ? "medium" : "low";
  const explanation =
    tier === "high"
      ? `${available.length} sources agree within ${spread_pct.toFixed(1)}% of each other`
      : tier === "medium"
      ? `${available.length} sources with ${spread_pct.toFixed(1)}% spread — moderate agreement`
      : `${available.length} sources disagree (${spread_pct.toFixed(1)}% spread) — rent estimate uncertain`;

  return {
    label: "Rent estimate",
    tier,
    source: available.map((s) => s.source),
    value: `$${property.rent_estimate.mid.toLocaleString()}/mo`,
    explanation,
    is_modeled: false,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Price confidence — validated if multiple sources agree within 10%
// ───────────────────────────────────────────────────────────────────────────

export function calculatePriceConfidence(property: FeedProperty): InputConfidence {
  const sources = Object.entries(property.listing.price_sources);
  const sourceCount = sources.length;
  const conflictPct = property.listing.price_conflict_pct ?? 0;
  const conflictFlagged = property.listing.price_conflict_flagged;

  let tier: ConfidenceTier;
  let explanation: string;

  if (sourceCount === 0) {
    tier = "low";
    explanation = "No price sources available";
  } else if (sourceCount === 1) {
    tier = "medium";
    explanation = `Single source (${sources[0][0]}) — not cross-validated`;
  } else if (conflictFlagged) {
    tier = "low";
    explanation = `${sourceCount} sources disagree by ${(conflictPct * 100).toFixed(1)}% — price uncertain`;
  } else if (conflictPct > 0.05) {
    tier = "medium";
    explanation = `${sourceCount} sources with ${(conflictPct * 100).toFixed(1)}% variance`;
  } else {
    tier = "high";
    explanation = `${sourceCount} sources agree within ${(conflictPct * 100).toFixed(1)}% — strong validation`;
  }

  return {
    label: "Purchase price",
    tier,
    source: sources.map(([s]) => s as DataSource),
    value: `$${property.listing.price.toLocaleString()}`,
    explanation,
    is_modeled: false,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Modeled inputs — honest labeling
// ───────────────────────────────────────────────────────────────────────────

export function calculatePropertyTaxConfidence(property: FeedProperty): InputConfidence {
  const tax = property.financials.leveraged?.operating_expenses.property_tax ?? 0;
  const source = property.financials.leveraged?.operating_expenses.property_tax_source ?? "attom";
  return {
    label: "Property tax",
    tier: "high",
    source,
    value: `$${tax.toLocaleString()}/mo`,
    explanation: "Actual assessment from county records",
    is_modeled: false,
  };
}

export function modeledConfidence(
  label: string,
  value: string,
  formula: string
): InputConfidence {
  return {
    label,
    tier: "medium",
    source: "calculated",
    value,
    explanation: `Modeled: ${formula}`,
    is_modeled: true,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Full composite
// ───────────────────────────────────────────────────────────────────────────

export function calculateProfitConfidence(property: FeedProperty): ProfitConfidence {
  const rent = calculateRentConfidence(property);
  const price = calculatePriceConfidence(property);
  const property_tax = calculatePropertyTaxConfidence(property);

  const lev = property.financials.leveraged!;
  const rentAmount = lev.gross_monthly_rent;

  const insurance = modeledConfidence(
    "Insurance",
    `$${lev.operating_expenses.insurance}/mo`,
    "$150/mo estimate. Real quote needed for accuracy."
  );
  const management = modeledConfidence(
    "Property management",
    `$${lev.operating_expenses.property_management}/mo`,
    "10% of gross rent — industry standard"
  );
  const vacancy_reserve = modeledConfidence(
    "Vacancy reserve",
    `$${lev.operating_expenses.vacancy_reserve}/mo`,
    "5% of gross rent — conservative buffer"
  );
  const capex_reserve = modeledConfidence(
    "CapEx reserve",
    `$${lev.operating_expenses.capex_reserve}/mo`,
    property.listing.year_built && property.listing.year_built < 1950
      ? "1.5% of price (older home adjustment)"
      : "1% of price — industry standard"
  );

  const mortgage: InputConfidence =
    lev.financing.mode === "leveraged"
      ? {
          label: "Mortgage",
          tier: "high",
          source: "calculated",
          value: `$${lev.financing.mortgage_monthly.toLocaleString()}/mo`,
          explanation: `${lev.financing.interest_rate_pct}% × ${lev.financing.loan_term_years}yr fixed-rate amortization (FRED)`,
          is_modeled: true,
        }
      : {
          label: "Mortgage",
          tier: "high",
          source: "calculated",
          value: "—",
          explanation: "Cash purchase — no mortgage",
          is_modeled: false,
        };

  // Composite = worst of non-modeled inputs (rent + price drive everything)
  const drivingTiers: ConfidenceTier[] = [rent.tier, price.tier];
  const tier = worstTier(drivingTiers);

  const composite_score = Math.round(
    drivingTiers.reduce((sum, t) => sum + TIER_SCORE[t], 0) / drivingTiers.length
  );

  const weakest_link =
    TIER_RANK[rent.tier] < TIER_RANK[price.tier] ? rent.label :
    TIER_RANK[price.tier] < TIER_RANK[rent.tier] ? price.label :
    rent.label;

  const summary =
    tier === "high"
      ? "High confidence — rent and price both well-validated across multiple sources"
      : tier === "medium"
      ? `Moderate confidence — ${weakest_link.toLowerCase()} has some uncertainty`
      : `Low confidence — ${weakest_link.toLowerCase()} uncertain. Verify before committing.`;

  return {
    tier,
    composite_score,
    rent,
    price,
    property_tax,
    insurance,
    management,
    vacancy_reserve,
    capex_reserve,
    mortgage,
    weakest_link,
    summary,
  };
}
