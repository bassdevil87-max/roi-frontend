// Types mirror the ROI Platform backend models from Phase 1.
// Every API source from the brief has a visible data footprint here.
// Keep field names identical to backend for zero-friction API integration.

export type PropertyType =
  | "single_family"
  | "duplex"
  | "triplex"
  | "fourplex"
  | "multi_family_5_plus"
  | "condo"
  | "townhouse"
  | "mobile_home";

export type ListingStatus = "active" | "pending" | "contingent" | "sold" | "off_market" | "unknown";

export type RentConfidence = "green" | "yellow" | "red";

export type ConditionConfidence = "strong" | "moderate" | "unknown";

export type DealStatus = "pass" | "pass_with_warnings" | "fail";

// Every data point can be traced back to its source API.
export type DataSource =
  | "zillow"
  | "propstream"
  | "attom"
  | "rentcast"
  | "dwellsy"
  | "experian_rentbureau"
  | "shovels"
  | "google_maps"
  | "google_vision"
  | "aws_rekognition"
  | "housecanary"
  | "neighborhoodscout"
  | "first_street"
  | "climatecheck"
  | "census_acs"
  | "regrid"
  | "lightcast"
  | "hud"
  | "fema"
  | "eviction_lab"
  | "calculated"    // Derived from other sources
  | "mock";         // Demo fallback

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  fips_code?: string;
  census_tract?: string;
}

// ─── Listing ────────────────────────────────────────────────────────────────

export interface PropertyListing {
  source: DataSource;                     // Primary source (Zillow, PropStream, ATTOM)
  external_id: string;
  status: ListingStatus;
  property_type: PropertyType;
  price: number;
  price_sources: Partial<Record<DataSource, number>>;   // Each source's reported price
  price_conflict_flagged: boolean;
  price_conflict_pct?: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  year_built: number | null;
  days_on_market: number | null;
  hoa_monthly: number | null;
}

// ─── Rent Estimation (Dwellsy + RentCast + Active Listings + Experian) ──────

export interface RentSourceBreakdown {
  source: DataSource;
  rent_estimate: number | null;           // null if source didn't return data
  low: number | null;
  high: number | null;
  comp_count: number;
  weight: number;                         // Weight in the blend
  is_available: boolean;
}

export interface RentUnit {
  unit_id: string;
  bedrooms: number;
  rent_low: number;
  rent_mid: number;
  rent_high: number;
  confidence: RentConfidence | null;
  sources_breakdown: RentSourceBreakdown[];   // Full per-source detail
  comp_count_total: number;
  spread_pct: number;                         // Max deviation across sources
}

export interface RentEstimate {
  low: number;
  mid: number;
  high: number;
  confidence: RentConfidence;
  units: RentUnit[];
}

// ─── Financials ─────────────────────────────────────────────────────────────

export interface OperatingExpensesBreakdown {
  property_tax: number;
  property_tax_source: DataSource;        // ATTOM | PropStream | county
  insurance: number;
  property_management: number;
  vacancy_reserve: number;
  capex_reserve: number;
  hoa: number;
  flood_insurance: number;
  total_operating: number;
}

export interface FinancingView {
  mode: "leveraged";
  down_payment_pct: number;
  down_payment_amount: number;
  loan_amount: number;
  interest_rate_pct: number;
  loan_term_years: number;
  mortgage_monthly: number;
}

export interface CashFinancingView {
  mode: "cash_purchase";
}

export interface CashFlowResult {
  purchase_price: number;
  gross_monthly_rent: number;
  operating_expenses: OperatingExpensesBreakdown;
  noi_monthly: number;
  noi_annual: number;
  cap_rate_pct: number;
  gross_rent_multiplier: number;
  financing: FinancingView | CashFinancingView;
  monthly_cash_flow: number;
  annual_cash_flow: number;
  cash_on_cash_return_pct?: number;
}

// ─── Deal Score ─────────────────────────────────────────────────────────────

export interface DealScore {
  status: DealStatus | null;
  hard_fails: string[];
  warnings: string[];
  adjustments: string[];
}

// ─── Thesis ─────────────────────────────────────────────────────────────────

export interface ThesisMatch {
  thesis_id: string;
  match_score_pct: number;
  matched: string[];
  unmatched: string[];
  partial: string[];
}

// ─── Vacancy (Census ACS) ───────────────────────────────────────────────────

export interface VacancyData {
  zip_rate: number | null;                // From Census ACS
  us_avg: number | null;
  state_avg: number | null;
  source: DataSource;                     // Always census_acs
}

// ─── Section 8 (HUD) ────────────────────────────────────────────────────────

export interface Section8 {
  flag_triggered: boolean;
  fmr_for_unit_size?: number | null;
  premium_over_market?: number | null;
  voucher_waitlist_length?: number | null;
  source: DataSource;                     // Always hud
}

// ─── Condition (Street View + Vision + Rekognition + Shovels) ───────────────

export interface ConditionSignalItem {
  name: string;
  source: DataSource;                     // which API generated this signal
  fired: boolean;
  layer: number;
  score: number | null;
  notes: string | null;
}

export interface ConditionBundle {
  confidence: ConditionConfidence;
  signals: ConditionSignalItem[];
}

// ─── Demand Anchors (Google Maps) ───────────────────────────────────────────

export interface DemandAnchor {
  type: string;
  name: string;
  distance_miles: number;
  structural: boolean;
  source: DataSource;                     // Always google_maps
}

// ─── Permits (Shovels) ──────────────────────────────────────────────────────

export interface Permit {
  type: string;
  date: string | null;
  description: string | null;
  source: DataSource;                     // Always shovels
}

// ─── Climate Risk (First Street + ClimateCheck + FEMA) ──────────────────────

export interface ClimateHazard {
  score: number;              // 1-10, 10 = highest risk, projected to 2050
  tier: "minimal" | "minor" | "moderate" | "major" | "severe";
  notes?: string;
}

export interface ClimateRisk {
  source: DataSource;         // first_street | climatecheck
  flood: ClimateHazard;
  wildfire: ClimateHazard;
  heat: ClimateHazard;
  wind: ClimateHazard;
  fema_zone: string;          // "X", "AE", "VE", etc.
  fema_high_risk: boolean;
  flood_insurance_monthly_est: number | null;
  fema_source: DataSource;    // Always "fema"
}

// ─── Property Value AVM (HouseCanary) ───────────────────────────────────────

export interface HouseCanaryAVM {
  source: DataSource;         // Always housecanary
  value_estimate: number;
  value_low: number;
  value_high: number;
  confidence: "high" | "medium" | "low";
  vs_listing_pct: number;     // +5% = AVM is 5% above listing (undervalued?)
}

// ─── Appreciation Forecast (NeighborhoodScout) ──────────────────────────────

export interface AppreciationForecast {
  source: DataSource;         // Always neighborhoodscout
  forecast_1yr_pct: number;
  forecast_3yr_pct: number;
  forecast_5yr_pct: number;
  neighborhood_grade: "A+" | "A" | "B+" | "B" | "C" | "D";
  percentile_national: number;   // 0-100, where this ZIP ranks nationally
}

// ─── Ground Truth Score (multi-signal composite) ────────────────────────────

export interface GroundTruthSignal {
  name: string;
  source: DataSource;
  value: number | null;       // Normalized 0-1
  weight: number;
  raw_value: number | string | null;
  is_available: boolean;
  description: string;        // Human-readable explanation
}

export interface GroundTruthScore {
  score: number | null;        // 0-1 composite
  signals: GroundTruthSignal[];
  interpretation: string;
  tier: "strong" | "mixed" | "weak" | "poor" | "unknown";
}

// ─── USPS Vacancy (Regrid) ──────────────────────────────────────────────────

export interface USPSVacancy {
  source: DataSource;         // Always regrid
  vacancy_flag: boolean;
  residential_delivery_indicator: boolean;
  last_updated: string;
  zip_vacancy_rate: number;
}

// ─── Eviction Data (Eviction Lab) ───────────────────────────────────────────

export interface EvictionData {
  source: DataSource;         // Always eviction_lab
  filings_per_1000_renters: number;
  year_over_year_change_pct: number;
  percentile_national: number;   // Lower is better
  last_updated: string;
}

// ─── Job Market (Lightcast) ─────────────────────────────────────────────────

export interface JobMarketData {
  source: DataSource;         // Always lightcast
  active_postings: number;
  growth_12mo_pct: number;
  top_employers: string[];
  dominant_industries: string[];
  zip_percentile_national: number;
}

// ─── Top-level FeedProperty ─────────────────────────────────────────────────

export interface FeedProperty {
  address: Address;
  listing: PropertyListing;
  rent_estimate: RentEstimate;
  financials: {
    leveraged: CashFlowResult | null;
    cash: CashFlowResult | null;
  };
  deal_score: DealScore;
  thesis_matches: ThesisMatch[];

  // Each maps to ONE API source:
  vacancy: VacancyData;                 // Census ACS
  section8: Section8;                    // HUD
  condition: ConditionBundle;            // Street View + Vision + Rekognition + Shovels
  demand_anchors: DemandAnchor[];        // Google Maps
  permits: Permit[];                      // Shovels
  climate_risk: ClimateRisk;             // First Street + FEMA
  housecanary_avm: HouseCanaryAVM | null;             // HouseCanary
  appreciation: AppreciationForecast | null;          // NeighborhoodScout
  ground_truth: GroundTruthScore;        // Multi-signal: Census + Regrid + Eviction Lab + Lightcast + calc
  usps_vacancy: USPSVacancy | null;                   // Regrid
  eviction_data: EvictionData | null;                 // Eviction Lab
  job_market: JobMarketData | null;                   // Lightcast

  risk_flags: string[];

  // Frontend-only enrichments
  hero_image?: string;
  projection_3y?: number;
  growth_reasons?: string[];
  tenant_in_place?: {
    rent_monthly: number;
    lease_active_until: string;
  };
  risks?: Array<{
    title: string;
    description: string;
    impact: "medium" | "high";
    icon: string;
  }>;
}

export interface Thesis {
  thesis_id: string;
  user_id: string;
  goal: "cash_flow" | "appreciation" | "balanced";
  property_type_pref: "single_family_only" | "multi_family_only" | "any";
  states: string[];
  cities: string[];
  min_price: number | null;
  max_price: number | null;
  min_monthly_cash_flow: number | null;
  wants_section8: boolean | null;
  is_cash_purchase: boolean;
  down_payment_pct: number | null;
}

// ─── Display helpers ────────────────────────────────────────────────────────

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  zillow: "Zillow",
  propstream: "PropStream",
  attom: "ATTOM Data",
  rentcast: "RentCast",
  dwellsy: "Dwellsy API IQ",
  experian_rentbureau: "Experian RentBureau",
  shovels: "Shovels Permits",
  google_maps: "Google Maps",
  google_vision: "Google Vision AI",
  aws_rekognition: "AWS Rekognition",
  housecanary: "HouseCanary AVM",
  neighborhoodscout: "NeighborhoodScout",
  first_street: "First Street Foundation",
  climatecheck: "ClimateCheck",
  census_acs: "US Census ACS",
  regrid: "Regrid / USPS",
  lightcast: "Lightcast Labor Data",
  hud: "HUD",
  fema: "FEMA",
  eviction_lab: "Eviction Lab",
  calculated: "Calculated",
  mock: "Demo",
};
