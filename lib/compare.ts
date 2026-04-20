import type { FeedProperty } from "@/types/roi";

// ─────────────────────────────────────────────────────────────────────────────
// Compare engine — deterministic "property A vs property B" analysis.
//
// Produces a structured tradeoff summary given two properties, including:
//   - Overall verdict (which is stronger on cash flow, which on risk, etc.)
//   - Per-metric deltas (how much better/worse on each dimension)
//   - Natural-language synthesis of the tradeoff
//
// Deterministic: same inputs → same output. No LLM calls yet. When we add
// real AI analysis later, we swap in a different synthesis function.
// ─────────────────────────────────────────────────────────────────────────────

export type Winner = "a" | "b" | "tie";

export interface MetricComparison {
  label: string;
  valueA: number | string;
  valueB: number | string;
  formattedA: string;
  formattedB: string;
  /** Which property wins on this metric. "a" = A is better, "b" = B is better. */
  winner: Winner;
  /** Magnitude of the delta, 0-1 where 1 = very large difference. */
  magnitude: number;
  /** Display-ready delta text (e.g. "$340/mo more") */
  deltaText?: string;
  /** A higher value means better (e.g. cash flow) vs lower means better (e.g. eviction rate) */
  higherIsBetter: boolean;
  /** Optional note for "close tie" etc */
  note?: string;
}

export interface CompareResult {
  propertyA: FeedProperty;
  propertyB: FeedProperty;

  /** Which property "wins" overall based on weighted scoring. Can be tie. */
  overallWinner: Winner;
  /** 0-1, how decisive the overall winner is. */
  overallDecisiveness: number;

  /** Grouped metric comparisons */
  sections: {
    label: string;
    metrics: MetricComparison[];
  }[];

  /** Flat list of metrics for iteration convenience */
  allMetrics: MetricComparison[];

  /** Natural-language tradeoff synthesis, 2-4 sentences */
  synthesis: string;

  /** One-line bottom-line takeaway */
  bottomLine: string;

  /** Tags summarizing each property's strengths */
  tagsA: string[];
  tagsB: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickWinner(a: number, b: number, higherIsBetter: boolean): { winner: Winner; magnitude: number } {
  const diff = Math.abs(a - b);
  const max = Math.max(Math.abs(a), Math.abs(b), 0.0001);
  const magnitude = Math.min(1, diff / max);

  // If difference is negligible (<2%), call it a tie
  if (magnitude < 0.02) return { winner: "tie", magnitude: 0 };

  const aWins = higherIsBetter ? a > b : a < b;
  return { winner: aWins ? "a" : "b", magnitude };
}

function fmtMoney(n: number, withSign = false): string {
  const abs = Math.abs(n);
  const prefix = withSign && n > 0 ? "+" : n < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${prefix}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${prefix}$${Math.round(abs).toLocaleString()}`;
  return `${prefix}$${abs.toFixed(0)}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function fmtMaybeNull(n: number | null | undefined, formatter: (n: number) => string, fallback = "—"): string {
  return n == null ? fallback : formatter(n);
}

function deltaMoneyText(a: number, b: number, winner: Winner): string {
  if (winner === "tie") return "roughly equal";
  const diff = Math.abs(a - b);
  return `${fmtMoney(diff)}/mo ${winner === "a" ? "less" : "more"}`;
}

// ─── Metric builders ──────────────────────────────────────────────────────────

function financialMetrics(A: FeedProperty, B: FeedProperty): MetricComparison[] {
  const levA = A.financials.leveraged;
  const levB = B.financials.leveraged;

  const cashFlowA = levA?.monthly_cash_flow ?? 0;
  const cashFlowB = levB?.monthly_cash_flow ?? 0;
  const cashWin = pickWinner(cashFlowA, cashFlowB, true);

  const cocA = levA?.cash_on_cash_return_pct ?? 0;
  const cocB = levB?.cash_on_cash_return_pct ?? 0;
  const cocWin = pickWinner(cocA, cocB, true);

  const capA = levA?.cap_rate_pct ?? 0;
  const capB = levB?.cap_rate_pct ?? 0;
  const capWin = pickWinner(capA, capB, true);

  const priceA = A.listing.price;
  const priceB = B.listing.price;
  const priceWin = pickWinner(priceA, priceB, false); // Lower price is "better" — less capital at risk

  return [
    {
      label: "Monthly cash flow",
      valueA: cashFlowA,
      valueB: cashFlowB,
      formattedA: fmtMoney(cashFlowA),
      formattedB: fmtMoney(cashFlowB),
      winner: cashWin.winner,
      magnitude: cashWin.magnitude,
      deltaText: cashWin.winner === "tie" ? "roughly equal" :
        `${fmtMoney(Math.abs(cashFlowA - cashFlowB))}/mo ${cashWin.winner === "a" ? "A higher" : "B higher"}`,
      higherIsBetter: true,
    },
    {
      label: "Cash-on-cash return",
      valueA: cocA,
      valueB: cocB,
      formattedA: fmtPct(cocA),
      formattedB: fmtPct(cocB),
      winner: cocWin.winner,
      magnitude: cocWin.magnitude,
      deltaText: cocWin.winner === "tie" ? "roughly equal" :
        `${Math.abs(cocA - cocB).toFixed(1)}% ${cocWin.winner === "a" ? "A higher" : "B higher"}`,
      higherIsBetter: true,
    },
    {
      label: "Cap rate",
      valueA: capA,
      valueB: capB,
      formattedA: fmtPct(capA),
      formattedB: fmtPct(capB),
      winner: capWin.winner,
      magnitude: capWin.magnitude,
      higherIsBetter: true,
    },
    {
      label: "Purchase price",
      valueA: priceA,
      valueB: priceB,
      formattedA: fmtMoney(priceA),
      formattedB: fmtMoney(priceB),
      winner: priceWin.winner,
      magnitude: priceWin.magnitude,
      deltaText: priceWin.winner === "tie" ? "equal" :
        `${fmtMoney(Math.abs(priceA - priceB))} ${priceWin.winner === "a" ? "less (A)" : "less (B)"}`,
      higherIsBetter: false,
      note: "Lower price = less capital at risk",
    },
  ];
}

function marketMetrics(A: FeedProperty, B: FeedProperty): MetricComparison[] {
  const vacA = A.vacancy.zip_rate ?? 0.021;
  const vacB = B.vacancy.zip_rate ?? 0.021;
  const vacWin = pickWinner(vacA, vacB, false);

  const growthA = A.projection_3y ? (A.projection_3y - A.listing.price) / A.listing.price : 0;
  const growthB = B.projection_3y ? (B.projection_3y - B.listing.price) / B.listing.price : 0;
  const growthWin = pickWinner(growthA, growthB, true);

  const gtA = A.ground_truth?.composite_score ?? 0;
  const gtB = B.ground_truth?.composite_score ?? 0;
  const gtWin = pickWinner(gtA, gtB, true);

  return [
    {
      label: "ZIP vacancy rate",
      valueA: vacA,
      valueB: vacB,
      formattedA: fmtPct(vacA * 100),
      formattedB: fmtPct(vacB * 100),
      winner: vacWin.winner,
      magnitude: vacWin.magnitude,
      higherIsBetter: false,
      note: "Lower = higher tenant demand",
    },
    {
      label: "3-year appreciation forecast",
      valueA: growthA,
      valueB: growthB,
      formattedA: fmtPct(growthA * 100),
      formattedB: fmtPct(growthB * 100),
      winner: growthWin.winner,
      magnitude: growthWin.magnitude,
      higherIsBetter: true,
    },
    {
      label: "Ground Truth Score",
      valueA: gtA,
      valueB: gtB,
      formattedA: `${gtA.toFixed(0)}/100`,
      formattedB: `${gtB.toFixed(0)}/100`,
      winner: gtWin.winner,
      magnitude: gtWin.magnitude,
      higherIsBetter: true,
    },
  ];
}

function riskMetrics(A: FeedProperty, B: FeedProperty): MetricComparison[] {
  // Climate risk — aggregate 0-10 score across hazards
  const climateA = A.climate_risk
    ? (A.climate_risk.flood.score + A.climate_risk.wildfire.score + A.climate_risk.heat.score + A.climate_risk.wind.score) / 4
    : 0;
  const climateB = B.climate_risk
    ? (B.climate_risk.flood.score + B.climate_risk.wildfire.score + B.climate_risk.heat.score + B.climate_risk.wind.score) / 4
    : 0;
  const climateWin = pickWinner(climateA, climateB, false);

  // Risk flag count
  const riskCountA = A.risks?.length ?? 0;
  const riskCountB = B.risks?.length ?? 0;
  const riskCountWin = pickWinner(riskCountA, riskCountB, false);

  // Year built — older = more CapEx risk
  const yearA = A.listing.year_built ?? 2000;
  const yearB = B.listing.year_built ?? 2000;
  const yearWin = pickWinner(yearA, yearB, true);

  return [
    {
      label: "Climate risk (avg)",
      valueA: climateA,
      valueB: climateB,
      formattedA: `${climateA.toFixed(1)}/10`,
      formattedB: `${climateB.toFixed(1)}/10`,
      winner: climateWin.winner,
      magnitude: climateWin.magnitude,
      higherIsBetter: false,
      note: "Lower = safer",
    },
    {
      label: "Risk flags",
      valueA: riskCountA,
      valueB: riskCountB,
      formattedA: `${riskCountA}`,
      formattedB: `${riskCountB}`,
      winner: riskCountWin.winner,
      magnitude: riskCountWin.magnitude,
      higherIsBetter: false,
    },
    {
      label: "Year built",
      valueA: yearA,
      valueB: yearB,
      formattedA: `${yearA}`,
      formattedB: `${yearB}`,
      winner: yearWin.winner,
      magnitude: yearWin.magnitude,
      higherIsBetter: true,
      note: "Newer = less deferred maintenance",
    },
  ];
}

// ─── Synthesis ────────────────────────────────────────────────────────────────

function determineOverall(metrics: MetricComparison[]): { winner: Winner; decisiveness: number } {
  // Weighted scoring: financial metrics count more than aesthetic ones.
  const weights: Record<string, number> = {
    "Monthly cash flow": 3,
    "Cash-on-cash return": 3,
    "Cap rate": 2,
    "Purchase price": 1,
    "ZIP vacancy rate": 2,
    "3-year appreciation forecast": 2,
    "Ground Truth Score": 2,
    "Climate risk (avg)": 2,
    "Risk flags": 1,
    "Year built": 1,
  };

  let scoreA = 0;
  let scoreB = 0;
  let totalWeight = 0;

  for (const m of metrics) {
    const w = weights[m.label] ?? 1;
    totalWeight += w;
    if (m.winner === "a") scoreA += w * m.magnitude;
    else if (m.winner === "b") scoreB += w * m.magnitude;
  }

  const diff = scoreA - scoreB;
  const decisiveness = Math.min(1, Math.abs(diff) / Math.max(totalWeight * 0.3, 0.001));

  if (Math.abs(diff) < 0.5) return { winner: "tie", decisiveness: 0 };
  return { winner: diff > 0 ? "a" : "b", decisiveness };
}

function buildTags(A: FeedProperty, B: FeedProperty, metrics: MetricComparison[]): { tagsA: string[]; tagsB: string[] } {
  const tagsA: string[] = [];
  const tagsB: string[] = [];

  // Section 8 flag
  if (A.section8?.flag_triggered) tagsA.push("Section 8 premium");
  if (B.section8?.flag_triggered) tagsB.push("Section 8 premium");

  // Tenant in place
  if (A.tenant_in_place) tagsA.push("Tenant in place");
  if (B.tenant_in_place) tagsB.push("Tenant in place");

  // Tag who wins on each major metric
  const cashFlow = metrics.find((m) => m.label === "Monthly cash flow");
  if (cashFlow?.winner === "a" && cashFlow.magnitude > 0.15) tagsA.push("Stronger cash flow");
  else if (cashFlow?.winner === "b" && cashFlow.magnitude > 0.15) tagsB.push("Stronger cash flow");

  const growth = metrics.find((m) => m.label === "3-year appreciation forecast");
  if (growth?.winner === "a" && growth.magnitude > 0.15) tagsA.push("Better appreciation");
  else if (growth?.winner === "b" && growth.magnitude > 0.15) tagsB.push("Better appreciation");

  const risk = metrics.find((m) => m.label === "Climate risk (avg)");
  if (risk?.winner === "a" && risk.magnitude > 0.2) tagsA.push("Lower climate risk");
  else if (risk?.winner === "b" && risk.magnitude > 0.2) tagsB.push("Lower climate risk");

  const price = metrics.find((m) => m.label === "Purchase price");
  if (price?.winner === "a" && price.magnitude > 0.15) tagsA.push("Less capital required");
  else if (price?.winner === "b" && price.magnitude > 0.15) tagsB.push("Less capital required");

  const vacancy = metrics.find((m) => m.label === "ZIP vacancy rate");
  if (vacancy?.winner === "a" && vacancy.magnitude > 0.2) tagsA.push("Stronger rental market");
  else if (vacancy?.winner === "b" && vacancy.magnitude > 0.2) tagsB.push("Stronger rental market");

  return { tagsA, tagsB };
}

function synthesize(A: FeedProperty, B: FeedProperty, metrics: MetricComparison[], winner: Winner): { synthesis: string; bottomLine: string } {
  const addrA = `${A.address.city}`;
  const addrB = `${B.address.city}`;

  const cashFlow = metrics.find((m) => m.label === "Monthly cash flow");
  const coc = metrics.find((m) => m.label === "Cash-on-cash return");
  const price = metrics.find((m) => m.label === "Purchase price");
  const climate = metrics.find((m) => m.label === "Climate risk (avg)");
  const vacancy = metrics.find((m) => m.label === "ZIP vacancy rate");
  const growth = metrics.find((m) => m.label === "3-year appreciation forecast");

  const parts: string[] = [];

  // Opening — who's stronger on yield?
  if (cashFlow && cashFlow.winner !== "tie") {
    const winnerName = cashFlow.winner === "a" ? addrA : addrB;
    const delta = Math.abs((cashFlow.valueA as number) - (cashFlow.valueB as number));
    const cocDelta = coc && coc.winner === cashFlow.winner
      ? `${Math.abs((coc.valueA as number) - (coc.valueB as number)).toFixed(1)}% higher cash-on-cash`
      : "";
    parts.push(
      `The ${winnerName} property delivers ${fmtMoney(delta)}/mo more cash flow${cocDelta ? ` and ${cocDelta}` : ""}.`
    );
  }

  // Price/capital angle
  if (price && price.magnitude > 0.1) {
    const cheaperCity = price.winner === "a" ? addrA : addrB;
    const delta = Math.abs((price.valueA as number) - (price.valueB as number));
    parts.push(
      `${cheaperCity} requires ${fmtMoney(delta)} less capital upfront.`
    );
  }

  // Risk angle
  if (climate && climate.magnitude > 0.2) {
    const riskierCity = climate.winner === "a" ? addrB : addrA;
    parts.push(
      `${riskierCity} carries meaningfully higher climate risk — something to weigh against its other strengths.`
    );
  } else if (vacancy && vacancy.magnitude > 0.3) {
    const weakerCity = vacancy.winner === "a" ? addrB : addrA;
    parts.push(
      `${weakerCity} sits in a softer rental market, which could affect long-term occupancy.`
    );
  }

  // Growth
  if (growth && growth.magnitude > 0.2) {
    const growthCity = growth.winner === "a" ? addrA : addrB;
    parts.push(
      `${growthCity} has the stronger 3-year appreciation outlook.`
    );
  }

  // Bottom line
  let bottomLine: string;
  if (winner === "tie") {
    bottomLine = "These are close — the right pick depends on whether you want cash flow or appreciation.";
  } else {
    const winnerCity = winner === "a" ? addrA : addrB;
    const loserCity = winner === "a" ? addrB : addrA;
    // Figure out what the winner wins on
    const winnerStrengths: string[] = [];
    if (cashFlow && cashFlow.winner === winner) winnerStrengths.push("cash flow");
    if (growth && growth.winner === winner) winnerStrengths.push("appreciation");
    if (climate && climate.winner === winner) winnerStrengths.push("lower risk");
    if (vacancy && vacancy.winner === winner) winnerStrengths.push("tenant demand");

    if (winnerStrengths.length === 0) {
      bottomLine = `Leaning ${winnerCity} on balance.`;
    } else {
      bottomLine = `${winnerCity} wins on ${winnerStrengths.slice(0, 2).join(" and ")}. ${loserCity} may still fit if you value other factors.`;
    }
  }

  if (parts.length === 0) {
    parts.push(`${addrA} and ${addrB} compare closely on the core metrics.`);
  }

  return {
    synthesis: parts.join(" "),
    bottomLine,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function compareProperties(A: FeedProperty, B: FeedProperty): CompareResult {
  const financial = financialMetrics(A, B);
  const market = marketMetrics(A, B);
  const risk = riskMetrics(A, B);

  const allMetrics = [...financial, ...market, ...risk];
  const { winner, decisiveness } = determineOverall(allMetrics);
  const { tagsA, tagsB } = buildTags(A, B, allMetrics);
  const { synthesis, bottomLine } = synthesize(A, B, allMetrics, winner);

  return {
    propertyA: A,
    propertyB: B,
    overallWinner: winner,
    overallDecisiveness: decisiveness,
    sections: [
      { label: "Financials", metrics: financial },
      { label: "Market & Demand", metrics: market },
      { label: "Risk", metrics: risk },
    ],
    allMetrics,
    synthesis,
    bottomLine,
    tagsA,
    tagsB,
  };
}
