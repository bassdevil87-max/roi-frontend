// ─────────────────────────────────────────────────────────────────────────────
// Listing enricher — converts raw HasData scraper output into the FeedProperty
// shape the ROI frontend expects.
//
// What HasData gives us:
//   • Real: price, address, beds/baths, sqft, photos, year built, zpid, zestimate
//   • Real (sometimes): rent zestimate, tax assessed value, days on Zillow
//
// What HasData does NOT give us (so we calculate or mock):
//   • Rent blend with multiple sources → use rentZestimate + ±15% range
//   • Monthly profit math → calculated from real price using NJ-style assumptions
//   • FEMA flood zone → mock (would need FEMA API)
//   • HUD Fair Market Rents → mock (would need HUD API)
//   • Census vacancy → mock (would need Census API)
//   • Climate risk → mock (would need First Street)
//   • Condition signals → mock
//   • Ground Truth Score → mock
//   • Demand anchors → mock
//
// This is expected and correct for Phase 1. Real enrichment comes when the
// backend is deployed and wired in.
// ─────────────────────────────────────────────────────────────────────────────
 
import type { FeedProperty } from "@/types/roi";
import type { HasDataListing } from "./hasdata";
 
// ─── Financial assumptions ────────────────────────────────────────────────────
 
const ASSUMPTIONS = {
  downPaymentPct: 0.20,
  mortgageRate: 0.07,
  termYears: 30,
  propertyTaxRateAnnual: 0.023,       // 2.3% — NJ average, high end of US
  insuranceMonthly: 150,
  propertyMgmtPct: 0.10,
  vacancyReservePct: 0.05,
  capexReservePctValue: 0.01,         // 1% of property value / year
  capexReservePctOldHome: 0.015,      // 1.5% for pre-1950 homes
  rentToPriceRatioFallback: 0.0055,   // 0.55%/mo of price = fallback when no rentZestimate
};
 
// ─── Formatting helpers ───────────────────────────────────────────────────────
 
function estimateMonthlyRent(listing: HasDataListing): { estimate: number; low: number; high: number } {
  const rentZestimate = listing.hdpData?.homeInfo?.rentZestimate;
  const price = listing.unformattedPrice ?? 0;
 
  // Prefer the rentZestimate when available
  const estimate = rentZestimate && rentZestimate > 100
    ? rentZestimate
    : Math.round(price * ASSUMPTIONS.rentToPriceRatioFallback);
 
  // Confidence range: ±15% (mock — in production this comes from the rent blend)
  return {
    estimate,
    low: Math.round(estimate * 0.85),
    high: Math.round(estimate * 1.15),
  };
}
 
function calculateMortgagePayment(price: number): number {
  const principal = price * (1 - ASSUMPTIONS.downPaymentPct);
  const monthlyRate = ASSUMPTIONS.mortgageRate / 12;
  const numPayments = ASSUMPTIONS.termYears * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}
 
function calculateFinancials(listing: HasDataListing) {
  const price = listing.unformattedPrice ?? 0;
  const { estimate: rent, low: rentLow, high: rentHigh } = estimateMonthlyRent(listing);
 
  const mortgage = calculateMortgagePayment(price);
  const propertyTax = (price * ASSUMPTIONS.propertyTaxRateAnnual) / 12;
  const insurance = ASSUMPTIONS.insuranceMonthly;
  const propertyMgmt = rent * ASSUMPTIONS.propertyMgmtPct;
  const vacancy = rent * ASSUMPTIONS.vacancyReservePct;
  const yearBuilt = listing.hdpData?.homeInfo?.yearBuilt ?? 1980;
  const capexPct = yearBuilt < 1950
    ? ASSUMPTIONS.capexReservePctOldHome
    : ASSUMPTIONS.capexReservePctValue;
  const capex = (price * capexPct) / 12;
 
  const totalExpenses = mortgage + propertyTax + insurance + propertyMgmt + vacancy + capex;
  const monthlyProfit = rent - totalExpenses;
 
  // Cash deal (no mortgage)
  const cashTotalExpenses = propertyTax + insurance + propertyMgmt + vacancy + capex;
  const cashMonthlyProfit = rent - cashTotalExpenses;
  const cashAnnualNOI = cashMonthlyProfit * 12;
  const capRatePct = price > 0 ? (cashAnnualNOI / price) * 100 : 0;
 
  // Cash-on-cash: yearly profit / yearly invested capital (down payment + closing costs)
  const downPayment = price * ASSUMPTIONS.downPaymentPct;
  const closingCosts = price * 0.03;
  const initialInvestment = downPayment + closingCosts;
  const cashOnCashPct = initialInvestment > 0
    ? ((monthlyProfit * 12) / initialInvestment) * 100
    : 0;
 
  return {
    rent,
    rentLow,
    rentHigh,
    mortgage,
    propertyTax,
    insurance,
    propertyMgmt,
    vacancy,
    capex,
    totalExpenses,
    monthlyProfit,
    cashMonthlyProfit,
    cashAnnualNOI,
    capRatePct,
    cashOnCashPct,
  };
}
 
function mapHomeType(hasDataType?: string): FeedProperty["listing"]["property_type"] {
  const t = (hasDataType ?? "").toUpperCase();
  if (t.includes("MULTI")) return "multi_family";
  if (t.includes("CONDO")) return "condo";
  if (t.includes("TOWN")) return "townhouse";
  if (t.includes("MANUFACTURED") || t.includes("MOBILE")) return "single_family";
  return "single_family";
}
 
// ─── Mock enrichment for fields HasData doesn't provide ────────────────────────
//
// These functions generate reasonable-looking mocked data per-property so the
// frontend renders a complete page. When backend APIs (FEMA, HUD, Census) come
// online, replace these with real calls.
 
function mockVacancy(zip?: string): FeedProperty["vacancy"] {
  // Rough NYC-area assumption: vacancy typically 2.5-4% in outer boroughs,
  // 1-2% in Manhattan. Without a real Census call we pick a mid-range.
  const zipNum = zip ? parseInt(zip.slice(0, 3)) : 100;
  const zipRate = zipNum >= 100 && zipNum <= 104 ? 0.015 : 0.028;
  return {
    zip_rate: zipRate,
    state_rate: 0.047,
    national_rate: 0.061,
    interpretation: zipRate < 0.03
      ? "Strong rental demand in this ZIP"
      : "Typical rental demand for the area",
  };
}
 
function mockDemandAnchors(city?: string, state?: string): FeedProperty["demand_anchors"] {
  // In NYC these are easy guesses. For a real implementation, Google Places API.
  return {
    primary: [
      { type: "transit", name: "NYC Subway access", distance_miles: 0.3 },
      { type: "hospital", name: "Nearby medical center", distance_miles: 1.2 },
    ],
    secondary: [
      { type: "employment", name: "Commutable to Manhattan CBD", distance_miles: 8 },
      { type: "downtown", name: "Walkable neighborhood", distance_miles: 0.1 },
    ],
  };
}
 
function mockRisks(yearBuilt?: number): FeedProperty["risks"] {
  const risks: FeedProperty["risks"] = [];
  if (yearBuilt && yearBuilt < 1950) {
    risks.push({
      type: "age",
      severity: "flag",
      label: "Pre-1950 construction",
      detail: "CapEx reserve raised to 1.5% to account for deferred maintenance risk.",
    });
  }
  return risks;
}
 
// ─── Main enrichment ──────────────────────────────────────────────────────────
 
/**
 * Convert a single HasData listing into the FeedProperty shape the UI expects.
 */
export function enrichListing(
  listing: HasDataListing,
  thesisId: string = "demo_thesis"
): FeedProperty | null {
  const price = listing.unformattedPrice;
  if (!price || !listing.zpid) return null;  // Skip broken listings
 
  const address = {
    street: listing.addressStreet ?? listing.address?.split(",")[0] ?? "",
    city: listing.addressCity ?? "",
    state: listing.addressState ?? "",
    zip_code: listing.addressZipcode ?? "",
    latitude: listing.latLong?.latitude ?? 0,
    longitude: listing.latLong?.longitude ?? 0,
  };
 
  const fin = calculateFinancials(listing);
  const beds = listing.beds ?? listing.hdpData?.homeInfo ? listing.beds : 0;
  const baths = listing.baths ?? 0;
  const sqft = listing.area ?? listing.hdpData?.homeInfo?.livingArea ?? 0;
  const yearBuilt = listing.hdpData?.homeInfo?.yearBuilt;
  const propertyType = mapHomeType(listing.hdpData?.homeInfo?.homeType);
  const daysOnZillow = listing.hdpData?.homeInfo?.daysOnZillow ?? 0;
 
  // Cash-flow-friendly match score — if it cash-flows >$200/mo, call it a good match
  const matchScore = Math.max(
    30,
    Math.min(98, 60 + Math.round(fin.monthlyProfit / 30))
  );
 
  return {
    listing: {
      external_id: `real_${listing.zpid}`,
      zpid: listing.zpid,
      source: "zillow_rapidapi", // actually HasData, but the type enum uses this label
      price,
      property_type: propertyType,
      listing_status: listing.statusType === "FOR_SALE" ? "active" : "pending",
      beds: beds ?? 0,
      baths: baths ?? 0,
      square_feet: sqft,
      year_built: yearBuilt,
      days_on_market: daysOnZillow,
      url: listing.detailUrl,
    },
    address,
    hero_image: listing.imgSrc,
 
    financials: {
      leveraged: {
        monthly_cash_flow: Math.round(fin.monthlyProfit),
        cash_on_cash_return_pct: Math.round(fin.cashOnCashPct * 10) / 10,
        cap_rate_pct: Math.round(fin.capRatePct * 10) / 10,
      },
      cash: {
        monthly_cash_flow: Math.round(fin.cashMonthlyProfit),
        cap_rate_pct: Math.round(fin.capRatePct * 10) / 10,
      },
      expense_breakdown: {
        rent_estimate: Math.round(fin.rent),
        rent_low: Math.round(fin.rentLow),
        rent_high: Math.round(fin.rentHigh),
        mortgage_pi: Math.round(fin.mortgage),
        property_tax: Math.round(fin.propertyTax),
        insurance: Math.round(fin.insurance),
        property_management: Math.round(fin.propertyMgmt),
        vacancy_reserve: Math.round(fin.vacancy),
        capex_reserve: Math.round(fin.capex),
      },
      assumptions: {
        down_payment_pct: ASSUMPTIONS.downPaymentPct,
        mortgage_rate: ASSUMPTIONS.mortgageRate,
        term_years: ASSUMPTIONS.termYears,
      },
    },
 
    rent_confidence: {
      tier: listing.hdpData?.homeInfo?.rentZestimate ? "medium" : "low",
      comp_count: listing.hdpData?.homeInfo?.rentZestimate ? 1 : 0,
      sources: listing.hdpData?.homeInfo?.rentZestimate
        ? ["zillow_rent_zestimate"]
        : [],
      explanation: listing.hdpData?.homeInfo?.rentZestimate
        ? "Using Zillow's rent Zestimate. Single-source estimate — add RentCast + HUD for higher confidence."
        : "No rent Zestimate available. Using price-to-rent ratio fallback. Add a rent data source for meaningful accuracy.",
    },
 
    vacancy: mockVacancy(address.zip_code),
    demand_anchors: mockDemandAnchors(address.city, address.state),
    risks: mockRisks(yearBuilt),
 
    // Everything below is not derivable from HasData alone
    section8: undefined,
    climate_risk: undefined,
    ground_truth: undefined,
    condition_signals: [],
    tenant_in_place: false,
    projection_3y: price * 1.12,  // mock — assume 4%/yr appreciation
 
    thesis_matches: [
      {
        thesis_id: thesisId,
        match_score_pct: matchScore,
        matched: [],
        unmatched: [],
        partial: [],
      },
    ],
  };
}
 
/**
 * Enrich a batch of HasData listings. Skips any that fail enrichment.
 */
export function enrichListings(
  listings: HasDataListing[],
  thesisId: string = "demo_thesis"
): FeedProperty[] {
  return listings
    .map((l) => enrichListing(l, thesisId))
    .filter((p): p is FeedProperty => p !== null);
}
 