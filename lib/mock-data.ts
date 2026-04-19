import type {
  FeedProperty,
  PropertyType,
  DataSource,
  ClimateHazard,
  RentSourceBreakdown,
  GroundTruthSignal,
} from "@/types/roi";

// ───────────────────────────────────────────────────────────────────────────
// Mock dataset — 48 properties across 11 states.
// Every API from the brief has a visible data footprint.
//
// APIs represented in the data:
//   Listings:    Zillow, PropStream, ATTOM
//   Rent:        Dwellsy, RentCast, Experian RentBureau, Zillow (active listings)
//   Property:    Shovels, HUD, FEMA, Google Maps, Google Vision, AWS Rekognition,
//                HouseCanary, NeighborhoodScout, Census ACS
//   Ground:      Regrid/USPS, Eviction Lab, Lightcast
//   Climate:     First Street, ClimateCheck (as fallback)
// ───────────────────────────────────────────────────────────────────────────

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Deterministic pseudo-random based on seed string (for reproducible mock data)
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h = (h ^= h >>> 16) >>> 0;
    return h / 4294967296;
  };
}

// Images categorized by property type for realistic matching.
// Each property type has multiple images; we pick deterministically by id.
const IMAGES_BY_TYPE: Record<string, string[]> = {
  // Single family - detached houses, ranch styles, colonials
  single_family: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=80",
  ],
  // Townhouses - row houses, urban brick
  townhouse: [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1200&q=80",
  ],
  // Condos - apartment building exteriors, modern glass
  condo: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1200&q=80",
  ],
  // Duplex - side-by-side or stacked two-unit homes
  duplex: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?auto=format&fit=crop&w=1200&q=80",
  ],
  // Triplex / fourplex - multi-unit buildings
  triplex: [
    "https://images.unsplash.com/photo-1625602812206-5ec545ca1231?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1629831116288-4c5b107abfa8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80",
  ],
  fourplex: [
    "https://images.unsplash.com/photo-1625602812206-5ec545ca1231?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
  ],
  // Larger multi-family
  multi_family_5_plus: [
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  ],
  mobile_home: [
    "https://images.unsplash.com/photo-1584738766473-61c083514bf4?auto=format&fit=crop&w=1200&q=80",
  ],
};

// Fallback pool if a type has no images (shouldn't happen but defensive)
const FALLBACK_IMAGES = IMAGES_BY_TYPE.single_family;

function pickImageForProperty(propertyType: string, seed: string): string {
  const pool = IMAGES_BY_TYPE[propertyType] ?? FALLBACK_IMAGES;
  const rnd = seededRandom(seed + "_img");
  return pool[Math.floor(rnd() * pool.length)];
}

// ───────────────────────────────────────────────────────────────────────────
// Climate risk lookups — by state, roughly accurate for demo purposes
// ───────────────────────────────────────────────────────────────────────────

function climateForState(state: string, isCoastal: boolean): {
  flood: ClimateHazard;
  wildfire: ClimateHazard;
  heat: ClimateHazard;
  wind: ClimateHazard;
} {
  const tier = (s: number): ClimateHazard["tier"] =>
    s >= 8 ? "severe" : s >= 6 ? "major" : s >= 4 ? "moderate" : s >= 2 ? "minor" : "minimal";
  const h = (score: number, notes?: string): ClimateHazard => ({
    score,
    tier: tier(score),
    notes,
  });

  const profiles: Record<string, [number, number, number, number]> = {
    // state: [flood, wildfire, heat, wind]
    NJ: [isCoastal ? 7 : 3, 1, 5, isCoastal ? 6 : 3],
    NY: [isCoastal ? 6 : 2, 1, 4, isCoastal ? 5 : 3],
    PA: [3, 1, 4, 2],
    TX: [5, 4, 8, 6],
    FL: [9, 2, 8, 8],
    GA: [5, 3, 7, 5],
    NC: [5, 2, 6, 5],
    OH: [3, 1, 5, 3],
    TN: [4, 2, 6, 4],
    IN: [3, 1, 5, 3],
    CA: [4, 8, 6, 3],
  };
  const [f, fire, heat, wind] = profiles[state] || [3, 2, 5, 3];
  return {
    flood: h(f, isCoastal ? "Coastal exposure increases risk" : undefined),
    wildfire: h(fire),
    heat: h(heat),
    wind: h(wind),
  };
}

// ───────────────────────────────────────────────────────────────────────────

interface SeedInput {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  fips: string;
  price: number;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  year_built: number;
  dom: number;
  hoa?: number;
  rent_mid: number;

  // Primary listing source — rotates across Zillow/PropStream/ATTOM
  primary_source?: DataSource;
  // If true, data also comes from a second source (creates comparison)
  secondary_source?: DataSource;
  // If primary and secondary conflict, set this for price_conflict_pct
  price_conflict_pct?: number;

  // Condition characteristics
  condition?: "strong" | "moderate" | "unknown";
  condition_has_listing_photos?: boolean;   // If true, Vision/Rekognition signals fire
  condition_signal_provider?: "google_vision" | "aws_rekognition";

  // Section 8 / HUD
  section8?: { fmr: number; waitlist: number };

  // Climate
  is_coastal?: boolean;

  // Ground truth specifics
  eviction_rate?: number;               // per 1000 renters
  job_growth_pct?: number;              // 12-month change
  usps_vacancy_rate?: number;

  // Other
  imageIdx?: number;
  anchors?: Array<{ type: string; name: string; distance: number }>;
  projection_3y_pct?: number;

  // NeighborhoodScout override
  nhood_grade?: "A+" | "A" | "B+" | "B" | "C" | "D";
}

// ───────────────────────────────────────────────────────────────────────────
// Build rent source breakdown — every property has data from at least 2 sources
// ───────────────────────────────────────────────────────────────────────────

function buildRentBreakdown(rent_mid: number, seed: string): RentSourceBreakdown[] {
  const rnd = seededRandom(seed + "_rent");

  // Experian RentBureau — highest-quality source (real leases). ~60% coverage.
  const hasExperian = rnd() < 0.6;
  // Dwellsy — contracted rents from PM software. ~70% coverage.
  const hasDwellsy = rnd() < 0.7;
  // RentCast — always available
  const hasRentCast = true;
  // Zillow active listings — always available
  const hasZillow = true;

  const spread = 0.06;
  const experian = hasExperian
    ? {
        source: "experian_rentbureau" as DataSource,
        rent_estimate: Math.round(rent_mid * (0.98 + rnd() * 0.04)),
        low: Math.round(rent_mid * 0.95),
        high: Math.round(rent_mid * 1.03),
        comp_count: 4 + Math.floor(rnd() * 8),
        weight: 0.4,
        is_available: true,
      }
    : {
        source: "experian_rentbureau" as DataSource,
        rent_estimate: null,
        low: null,
        high: null,
        comp_count: 0,
        weight: 0.4,
        is_available: false,
      };

  const dwellsy = hasDwellsy
    ? {
        source: "dwellsy" as DataSource,
        rent_estimate: Math.round(rent_mid * (0.97 + rnd() * 0.06)),
        low: Math.round(rent_mid * (1 - spread)),
        high: Math.round(rent_mid * (1 + spread)),
        comp_count: 3 + Math.floor(rnd() * 6),
        weight: 0.3,
        is_available: true,
      }
    : {
        source: "dwellsy" as DataSource,
        rent_estimate: null,
        low: null,
        high: null,
        comp_count: 0,
        weight: 0.3,
        is_available: false,
      };

  const rentcast = hasRentCast
    ? {
        source: "rentcast" as DataSource,
        rent_estimate: Math.round(rent_mid * (0.96 + rnd() * 0.08)),
        low: Math.round(rent_mid * 0.92),
        high: Math.round(rent_mid * 1.08),
        comp_count: 8 + Math.floor(rnd() * 10),
        weight: 0.2,
        is_available: true,
      }
    : null;

  const zillow = hasZillow
    ? {
        source: "zillow" as DataSource,
        rent_estimate: Math.round(rent_mid * (0.95 + rnd() * 0.1)),
        low: Math.round(rent_mid * 0.9),
        high: Math.round(rent_mid * 1.1),
        comp_count: 5 + Math.floor(rnd() * 8),
        weight: 0.1,
        is_available: true,
      }
    : null;

  return [experian, dwellsy, rentcast, zillow].filter(
    (x): x is RentSourceBreakdown => x !== null
  );
}

function buildGroundTruthSignals(s: SeedInput): {
  signals: GroundTruthSignal[];
  score: number;
  tier: "strong" | "mixed" | "weak" | "poor" | "unknown";
  interpretation: string;
} {
  const rnd = seededRandom(s.id + "_gt");

  // Census ACS — always available
  const vacancyRate = 0.03 + rnd() * 0.12;
  const medianRent = Math.round(s.rent_mid * (0.85 + rnd() * 0.2));
  const medianIncome = 35_000 + Math.floor(rnd() * 80_000);

  // USPS vacancy via Regrid — 75% coverage
  const hasUSPS = rnd() < 0.75;
  const uspsVacancyRate = hasUSPS ? vacancyRate * (0.9 + rnd() * 0.3) : null;

  // Eviction Lab — 85% coverage (public court data varies by jurisdiction)
  const hasEviction = rnd() < 0.85;
  const evictionRate = s.eviction_rate ?? (hasEviction ? 5 + rnd() * 45 : null);

  // Lightcast — 90% coverage in major metros
  const hasJobs = rnd() < 0.9;
  const jobGrowth = s.job_growth_pct ?? (hasJobs ? -10 + rnd() * 40 : null);

  // Rental disappearance velocity — derived from Zillow, always available
  const velocityDays = 8 + rnd() * 35;

  const signals: GroundTruthSignal[] = [
    {
      name: "Census vacancy rate",
      source: "census_acs",
      value: 1 - Math.min(1, vacancyRate / 0.15),
      weight: 0.20,
      raw_value: `${(vacancyRate * 100).toFixed(1)}%`,
      is_available: true,
      description: "Lower vacancy = stronger rental demand",
    },
    {
      name: "Median rent (ACS)",
      source: "census_acs",
      value: Math.min(1, medianRent / 2500),
      weight: 0.15,
      raw_value: `$${medianRent}/mo`,
      is_available: true,
      description: "Actual rents households pay, not asking prices",
    },
    {
      name: "USPS vacancy (Regrid)",
      source: "regrid",
      value: uspsVacancyRate !== null ? 1 - Math.min(1, uspsVacancyRate / 0.15) : null,
      weight: 0.20,
      raw_value: uspsVacancyRate !== null ? `${(uspsVacancyRate * 100).toFixed(1)}%` : null,
      is_available: hasUSPS,
      description: "Physical mail delivery — most accurate vacancy signal",
    },
    {
      name: "Eviction filing rate",
      source: "eviction_lab",
      value: evictionRate !== null ? 1 - Math.min(1, evictionRate / 60) : null,
      weight: 0.15,
      raw_value: evictionRate !== null ? `${evictionRate.toFixed(1)}/1000 renters` : null,
      is_available: hasEviction,
      description: "Rising filings signal tenant financial stress",
    },
    {
      name: "Job posting velocity",
      source: "lightcast",
      value: jobGrowth !== null ? Math.max(0, Math.min(1, (jobGrowth + 10) / 50)) : null,
      weight: 0.20,
      raw_value: jobGrowth !== null ? `${jobGrowth > 0 ? "+" : ""}${jobGrowth.toFixed(1)}% YoY` : null,
      is_available: hasJobs,
      description: "New jobs predict rent growth 6–18 months out",
    },
    {
      name: "Rental disappearance velocity",
      source: "zillow",
      value: Math.max(0, 1 - velocityDays / 45),
      weight: 0.10,
      raw_value: `${velocityDays.toFixed(0)} days on market`,
      is_available: true,
      description: "How fast rentals leave the market",
    },
  ];

  const available = signals.filter((s) => s.is_available && s.value !== null);
  const totalWeight = available.reduce((sum, s) => sum + s.weight, 0);
  const score = available.reduce((sum, s) => sum + (s.value ?? 0) * s.weight, 0) / (totalWeight || 1);

  const tier =
    score >= 0.75 ? "strong" :
    score >= 0.55 ? "mixed" :
    score >= 0.35 ? "weak" :
    score >= 0 ? "poor" : "unknown";

  const interpretation =
    tier === "strong" ? `Strong fundamentals. ${available.length} signals align positively.` :
    tier === "mixed" ? `Mixed signals. ${available.length} signals tracked with moderate confidence.` :
    tier === "weak" ? `Below-average fundamentals. Underwrite carefully.` :
    `Multiple negative indicators. High risk.`;

  return { signals, score: +score.toFixed(3), tier, interpretation };
}

// ───────────────────────────────────────────────────────────────────────────

function buildProperty(s: SeedInput): FeedProperty {
  const rnd = seededRandom(s.id);
  const price = s.price;
  const rent = s.rent_mid;

  // ─── Primary source rotation — 60% Zillow, 20% PropStream, 20% ATTOM ───
  const primarySource: DataSource =
    s.primary_source ?? (
      rnd() < 0.6 ? "zillow" :
      rnd() < 0.5 ? "propstream" :
      "attom"
    );

  // ─── Price sources: always have at least primary; sometimes add conflicts ─
  const priceSources: Partial<Record<DataSource, number>> = {
    [primarySource]: price,
  };
  let priceConflictPct: number | undefined;
  let priceConflictFlagged = false;

  if (s.secondary_source || rnd() < 0.55) {
    const secondary: DataSource =
      s.secondary_source ??
      (primarySource === "zillow"
        ? (rnd() < 0.5 ? "attom" : "propstream")
        : primarySource === "propstream"
        ? "attom"
        : "zillow");

    const conflictPct = s.price_conflict_pct ?? (rnd() < 0.2 ? 0.11 + rnd() * 0.05 : rnd() * 0.07);
    const direction = rnd() < 0.5 ? 1 : -1;
    priceSources[secondary] = Math.round(price * (1 + direction * conflictPct));
    priceConflictPct = +conflictPct.toFixed(3);
    priceConflictFlagged = conflictPct > 0.10;
  }

  // ─── Cash flow math ──────────────────────────────────────────────────────
  const downPaymentPct = 0.20;
  const rate = 0.07;
  const months = 360;
  const loanAmount = price * (1 - downPaymentPct);
  const monthlyRate = rate / 12;
  const mortgage = Math.round(
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1)
  );

  const taxAnnual = Math.round(price * 0.018);
  const propertyTax = Math.round(taxAnnual / 12);
  const insurance = 150;
  const management = Math.round(rent * 0.1);
  const vacancy = Math.round(rent * 0.05);
  const isPre1950 = s.year_built < 1950;
  const capexRate = isPre1950 ? 0.015 : 0.01;
  const capex = Math.round((price * capexRate) / 12);
  const hoa = s.hoa ?? 0;
  const floodInsuranceMonthly = s.is_coastal ? 175 + Math.round(rnd() * 100) : 0;

  // Climate risk (First Street primary, fallback to ClimateCheck)
  const climateProvider: DataSource = rnd() < 0.8 ? "first_street" : "climatecheck";
  const climate = climateForState(s.state, !!s.is_coastal);
  const femaHighRisk = s.is_coastal || climate.flood.score >= 6;
  const femaZone = femaHighRisk
    ? s.is_coastal ? "AE" : rnd() < 0.5 ? "AE" : "A"
    : "X";

  const totalOperating = propertyTax + insurance + management + vacancy + capex + hoa + (femaHighRisk ? floodInsuranceMonthly : 0);
  const noi = rent - totalOperating;
  const cashFlow = noi - mortgage;
  const cocReturn = ((cashFlow * 12) / (price * downPaymentPct)) * 100;

  // ─── Risks surfaced to user ─────────────────────────────────────────────
  const risks: NonNullable<FeedProperty["risks"]> = [];
  if (femaHighRisk) {
    risks.push({
      title: "Flood zone area",
      description: `FEMA zone ${femaZone}. Flood insurance adds $${floodInsuranceMonthly}/mo.`,
      impact: climate.flood.score >= 8 ? "high" : "medium",
      icon: "🌊",
    });
  }
  if (climate.wildfire.score >= 6) {
    risks.push({
      title: "Wildfire risk",
      description: `First Street wildfire score: ${climate.wildfire.score}/10. Projected to ${climate.wildfire.tier} by 2050.`,
      impact: climate.wildfire.score >= 8 ? "high" : "medium",
      icon: "🔥",
    });
  }
  if (climate.heat.score >= 7) {
    risks.push({
      title: "Extreme heat exposure",
      description: `Heat risk score: ${climate.heat.score}/10. Cooling costs and tenant comfort impacted.`,
      impact: "medium",
      icon: "🌡️",
    });
  }
  if (climate.wind.score >= 7) {
    risks.push({
      title: "Hurricane/wind risk",
      description: `Wind score: ${climate.wind.score}/10. Insurance premiums reflect this.`,
      impact: "medium",
      icon: "💨",
    });
  }
  if (price > 800_000) {
    risks.push({
      title: "Higher property tax",
      description: `Property tax of $${propertyTax}/mo is above state median.`,
      impact: "high",
      icon: "💰",
    });
  }
  if (isPre1950) {
    risks.push({
      title: `Built in ${s.year_built}`,
      description: "Older homes require more frequent repairs. CapEx reserve increased to 1.5%.",
      impact: "medium",
      icon: "🏚️",
    });
  }

  // ─── Section 8 (HUD) ────────────────────────────────────────────────────
  const section8Flag = !!s.section8;
  const s8Premium = s.section8 ? s.section8.fmr - rent : 0;

  // ─── Projections ─────────────────────────────────────────────────────────
  const projection3yPct = s.projection_3y_pct ?? (0.12 + rnd() * 0.18);
  const projection3y = Math.round(price * (1 + projection3yPct));

  // ─── HouseCanary AVM (Layer 4, usually available) ───────────────────────
  const hasHouseCanary = rnd() < 0.85;
  const avmValue = Math.round(price * (0.94 + rnd() * 0.14));
  const housecanary_avm: FeedProperty["housecanary_avm"] = hasHouseCanary
    ? {
        source: "housecanary",
        value_estimate: avmValue,
        value_low: Math.round(avmValue * 0.93),
        value_high: Math.round(avmValue * 1.07),
        confidence: rnd() < 0.7 ? "high" : "medium",
        vs_listing_pct: +(((avmValue - price) / price) * 100).toFixed(1),
      }
    : null;

  // ─── NeighborhoodScout appreciation forecast ─────────────────────────────
  const hasNHScout = rnd() < 0.9;
  const appreciation: FeedProperty["appreciation"] = hasNHScout
    ? {
        source: "neighborhoodscout",
        forecast_1yr_pct: +(2 + rnd() * 6).toFixed(1),
        forecast_3yr_pct: +(projection3yPct * 100).toFixed(1),
        forecast_5yr_pct: +(projection3yPct * 100 * 1.8).toFixed(1),
        neighborhood_grade: s.nhood_grade ?? (["A", "A", "B+", "B", "B", "C"][Math.floor(rnd() * 6)] as "A" | "B+" | "B" | "C"),
        percentile_national: Math.floor(40 + rnd() * 55),
      }
    : null;

  // ─── Condition signals ───────────────────────────────────────────────────
  const condition = s.condition ?? "moderate";
  const hasListingPhotos = s.condition_has_listing_photos ?? rnd() < 0.65;
  const photoSignalProvider: DataSource = s.condition_signal_provider ?? (rnd() < 0.5 ? "google_vision" : "aws_rekognition");

  const conditionSignals = [
    {
      name: "Street View exterior scan",
      source: "google_maps" as DataSource,
      fired: true,
      layer: 3,
      score: condition === "strong" ? 0.82 : condition === "moderate" ? 0.6 : 0.4,
      notes: condition === "strong"
        ? "Well-maintained. Recent exterior paint and landscaping."
        : condition === "moderate"
        ? "Average condition. Minor wear visible."
        : "Exterior shows wear. Several maintenance items.",
    },
    ...(hasListingPhotos
      ? [
          {
            name: photoSignalProvider === "google_vision" ? "Listing photos (Vision AI)" : "Listing photos (Rekognition)",
            source: photoSignalProvider,
            fired: true,
            layer: 4,
            score: condition === "strong" ? 0.85 : condition === "moderate" ? 0.65 : 0.45,
            notes: condition === "strong"
              ? "Modern finishes, updated kitchen and bathrooms detected."
              : condition === "moderate"
              ? "Mixed: some updated rooms, some dated."
              : "Older finishes throughout. No recent updates detected.",
          },
        ]
      : []),
    ...(isPre1950
      ? [
          {
            name: "Permit history",
            source: "shovels" as DataSource,
            fired: true,
            layer: 2,
            score: 0.7,
            notes: "Roof replacement 2019. Electrical upgrade 2021.",
          },
        ]
      : []),
  ];

  // ─── Ground Truth Score ─────────────────────────────────────────────────
  const gt = buildGroundTruthSignals(s);

  // ─── USPS vacancy (Regrid) ──────────────────────────────────────────────
  const uspsSignal = gt.signals.find((x) => x.source === "regrid");
  const usps_vacancy: FeedProperty["usps_vacancy"] = uspsSignal?.is_available
    ? {
        source: "regrid",
        vacancy_flag: rnd() < 0.1,
        residential_delivery_indicator: true,
        last_updated: "2026-03-15",
        zip_vacancy_rate: parseFloat(String(uspsSignal.raw_value).replace("%", "")) / 100,
      }
    : null;

  // ─── Eviction data ──────────────────────────────────────────────────────
  const evictionSignal = gt.signals.find((x) => x.source === "eviction_lab");
  const eviction_data: FeedProperty["eviction_data"] = evictionSignal?.is_available
    ? {
        source: "eviction_lab",
        filings_per_1000_renters: parseFloat(String(evictionSignal.raw_value).split("/")[0]),
        year_over_year_change_pct: +(-15 + rnd() * 30).toFixed(1),
        percentile_national: Math.floor(10 + rnd() * 80),
        last_updated: "2025-Q4",
      }
    : null;

  // ─── Job market (Lightcast) ─────────────────────────────────────────────
  const jobsSignal = gt.signals.find((x) => x.source === "lightcast");
  const job_market: FeedProperty["job_market"] = jobsSignal?.is_available
    ? {
        source: "lightcast",
        active_postings: 2000 + Math.floor(rnd() * 18_000),
        growth_12mo_pct: parseFloat(String(jobsSignal.raw_value).replace(/[+%YoY ]/g, "")),
        top_employers: topEmployersForCity(s.city),
        dominant_industries: dominantIndustriesForCity(s.city),
        zip_percentile_national: Math.floor(30 + rnd() * 65),
      }
    : null;

  // ─── Demand anchors (Google Maps) ───────────────────────────────────────
  const defaultAnchors = s.anchors || [
    { type: "university", name: "State University", distance: 3.2 },
    { type: "hospital", name: "Regional Medical Center", distance: 2.4 },
    { type: "transit", name: "Commuter rail station", distance: 1.8 },
  ];

  return {
    address: {
      street: s.street,
      city: s.city,
      state: s.state,
      zip: s.zip,
      county: s.county,
      fips_code: s.fips,
    },
    listing: {
      source: primarySource,
      external_id: s.id,
      status: "active",
      property_type: s.type,
      price,
      price_sources: priceSources,
      price_conflict_flagged: priceConflictFlagged,
      price_conflict_pct: priceConflictPct,
      bedrooms: s.bedrooms,
      bathrooms: s.bathrooms,
      sqft: s.sqft,
      year_built: s.year_built,
      days_on_market: s.dom,
      hoa_monthly: hoa || null,
    },
    rent_estimate: {
      low: Math.round(rent * 0.94),
      mid: rent,
      high: Math.round(rent * 1.06),
      confidence: "green",
      units: [
        {
          unit_id: "unit_1",
          bedrooms: s.bedrooms,
          rent_low: Math.round(rent * 0.94),
          rent_mid: rent,
          rent_high: Math.round(rent * 1.06),
          confidence: "green",
          sources_breakdown: buildRentBreakdown(rent, s.id),
          comp_count_total: 0, // Computed below
          spread_pct: 0.06,
        },
      ],
    },
    financials: {
      leveraged: {
        purchase_price: price,
        gross_monthly_rent: rent,
        operating_expenses: {
          property_tax: propertyTax,
          property_tax_source: primarySource === "zillow" ? "attom" : primarySource,
          insurance,
          property_management: management,
          vacancy_reserve: vacancy,
          capex_reserve: capex,
          hoa,
          flood_insurance: femaHighRisk ? floodInsuranceMonthly : 0,
          total_operating: totalOperating,
        },
        noi_monthly: noi,
        noi_annual: noi * 12,
        cap_rate_pct: +(((noi * 12) / price) * 100).toFixed(2),
        gross_rent_multiplier: +(price / (rent * 12)).toFixed(1),
        financing: {
          mode: "leveraged",
          down_payment_pct: 20,
          down_payment_amount: Math.round(price * downPaymentPct),
          loan_amount: Math.round(loanAmount),
          interest_rate_pct: 7.0,
          loan_term_years: 30,
          mortgage_monthly: mortgage,
        },
        monthly_cash_flow: cashFlow,
        annual_cash_flow: cashFlow * 12,
        cash_on_cash_return_pct: +cocReturn.toFixed(1),
      },
      cash: {
        purchase_price: price,
        gross_monthly_rent: rent,
        operating_expenses: {
          property_tax: propertyTax,
          property_tax_source: primarySource === "zillow" ? "attom" : primarySource,
          insurance,
          property_management: management,
          vacancy_reserve: vacancy,
          capex_reserve: capex,
          hoa,
          flood_insurance: femaHighRisk ? floodInsuranceMonthly : 0,
          total_operating: totalOperating,
        },
        noi_monthly: noi,
        noi_annual: noi * 12,
        cap_rate_pct: +(((noi * 12) / price) * 100).toFixed(2),
        gross_rent_multiplier: +(price / (rent * 12)).toFixed(1),
        financing: { mode: "cash_purchase" },
        monthly_cash_flow: noi,
        annual_cash_flow: noi * 12,
      },
    },
    deal_score: {
      status: cashFlow > 0 ? "pass" : "fail",
      hard_fails: cashFlow <= 0 ? ["negative_cash_flow"] : [],
      warnings: isPre1950 ? ["pre1950_construction"] : [],
      adjustments: isPre1950 ? ["pre1950_capex_adjustment"] : [],
    },
    thesis_matches: [
      {
        thesis_id: "demo_default",
        match_score_pct: 75,
        matched: [],
        unmatched: [],
        partial: [],
      },
    ],
    vacancy: {
      zip_rate: 0.02 + seededRandom(s.id + "_v")() * 0.08,
      us_avg: 0.066,
      state_avg: 0.055,
      source: "census_acs",
    },
    section8: section8Flag && s.section8
      ? {
          flag_triggered: true,
          fmr_for_unit_size: s.section8.fmr,
          premium_over_market: s8Premium,
          voucher_waitlist_length: s.section8.waitlist,
          source: "hud",
        }
      : { flag_triggered: false, source: "hud" },
    condition: {
      confidence: condition,
      signals: conditionSignals,
    },
    demand_anchors: defaultAnchors.map((a) => ({
      type: a.type,
      name: a.name,
      distance_miles: a.distance,
      structural: ["university", "hospital", "transit", "military_base", "port"].includes(a.type),
      source: "google_maps",
    })),
    permits: isPre1950
      ? [
          { type: "roof", date: "2019-05-10", description: "Roof replacement", source: "shovels" },
          { type: "electrical", date: "2021-08-22", description: "Panel upgrade", source: "shovels" },
        ]
      : [],
    climate_risk: {
      source: climateProvider,
      ...climate,
      fema_zone: femaZone,
      fema_high_risk: femaHighRisk,
      flood_insurance_monthly_est: femaHighRisk ? floodInsuranceMonthly : null,
      fema_source: "fema",
    },
    housecanary_avm,
    appreciation,
    ground_truth: {
      score: gt.score,
      signals: gt.signals,
      interpretation: gt.interpretation,
      tier: gt.tier,
    },
    usps_vacancy,
    eviction_data,
    job_market,
    risk_flags: [
      ...(isPre1950 ? ["pre1950_construction"] : []),
      ...(femaHighRisk ? [`fema_high_risk_zone:${femaZone}`] : []),
      ...(climate.wildfire.score >= 6 ? ["wildfire_risk"] : []),
      ...(climate.heat.score >= 7 ? ["heat_risk"] : []),
    ],
    hero_image: pickImageForProperty(s.type, s.id),
    projection_3y: projection3y,
    growth_reasons: [
      `Rents increased ${8 + Math.floor(seededRandom(s.id + "_r1")() * 8)}% in the last 3 years (Census ACS)`,
      `Homes now sell in ${6 + Math.floor(seededRandom(s.id + "_r2")() * 10)} days`,
      `Median household income grew ${10 + Math.floor(seededRandom(s.id + "_r3")() * 10)}% since 2021 (Census)`,
      `Lightcast: ${2000 + Math.floor(seededRandom(s.id + "_r4")() * 8000)} new job postings this year`,
      `Major development under construction nearby`,
    ],
    tenant_in_place:
      seededRandom(s.id + "_t")() > 0.4
        ? {
            rent_monthly: rent,
            lease_active_until: ["Jun 2026", "Sep 2026", "Dec 2026", "Mar 2027"][
              Math.floor(seededRandom(s.id + "_l")() * 4)
            ],
          }
        : undefined,
    risks,
  };
}

// ───────────────────────────────────────────────────────────────────────────

function topEmployersForCity(city: string): string[] {
  const map: Record<string, string[]> = {
    "Asbury Park": ["Hackensack Meridian Health", "Jersey Shore University Medical Center", "Monmouth County"],
    Trenton: ["State of New Jersey", "Capital Health", "Princeton University (nearby)"],
    Newark: ["Prudential Financial", "Rutgers-Newark", "Newark Liberty Airport"],
    Philadelphia: ["University of Pennsylvania", "Comcast", "Jefferson Health"],
    Pittsburgh: ["UPMC", "PNC Bank", "University of Pittsburgh"],
    Nashville: ["Vanderbilt University", "HCA Healthcare", "Nissan North America"],
    Austin: ["Tesla", "Dell", "Apple"],
    Atlanta: ["Delta Air Lines", "Emory University", "Home Depot"],
    Charlotte: ["Bank of America", "Wells Fargo", "Duke Energy"],
    Raleigh: ["IBM", "Duke University", "RTP employers"],
    Houston: ["ExxonMobil", "Memorial Hermann", "NASA"],
    Miami: ["Baptist Health", "Royal Caribbean", "University of Miami"],
    Columbus: ["JPMorgan Chase", "Ohio State University", "Nationwide"],
    Indianapolis: ["Eli Lilly", "IU Health", "Salesforce"],
  };
  return map[city] || ["Regional hospital", "State university", "Municipal government"];
}

function dominantIndustriesForCity(city: string): string[] {
  const map: Record<string, string[]> = {
    Philadelphia: ["Healthcare", "Education", "Financial Services"],
    Pittsburgh: ["Healthcare", "Technology", "Education"],
    Austin: ["Technology", "Government", "Education"],
    Nashville: ["Healthcare", "Music/Entertainment", "Hospitality"],
    Atlanta: ["Transportation", "Media", "Technology"],
  };
  return map[city] || ["Healthcare", "Education", "Retail"];
}

// ───────────────────────────────────────────────────────────────────────────
// 48 seed entries — unchanged structure, rebuilt with full API coverage
// ───────────────────────────────────────────────────────────────────────────

const SEEDS: SeedInput[] = [
  // ── NJ Asbury Park hero ─────────────────────────────────────────────────
  {
    id: "nj_asbury_001", street: "123 Ocean Ave", city: "Asbury Park", state: "NJ",
    zip: "07712", county: "Monmouth", fips: "34025",
    price: 1_680_812, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1850,
    year_built: 1920, dom: 18, rent_mid: 2100, condition: "strong",
    primary_source: "zillow", secondary_source: "propstream",
    section8: { fmr: 2350, waitlist: 1240 }, is_coastal: true, imageIdx: 0,
    nhood_grade: "A",
    anchors: [
      { type: "university", name: "Monmouth University", distance: 3.5 },
      { type: "hospital", name: "Jersey Shore Medical Center", distance: 2.1 },
      { type: "transit", name: "Direct train to NYC", distance: 0.6 },
    ],
  },
  // ── Remaining NJ ────────────────────────────────────────────────────────
  { id: "nj_trenton_001", street: "142 Broad St", city: "Trenton", state: "NJ", zip: "08611", county: "Mercer", fips: "34021", price: 185_000, type: "single_family", bedrooms: 3, bathrooms: 1.5, sqft: 1350, year_built: 1968, dom: 22, rent_mid: 1850, condition: "moderate", primary_source: "zillow", secondary_source: "attom", section8: { fmr: 1920, waitlist: 890 } },
  { id: "nj_ac_001", street: "78 Pacific Ave", city: "Atlantic City", state: "NJ", zip: "08401", county: "Atlantic", fips: "34001", price: 320_000, type: "single_family", bedrooms: 3, bathrooms: 1, sqft: 1100, year_built: 1932, dom: 45, rent_mid: 1680, condition: "moderate", primary_source: "propstream", is_coastal: true, imageIdx: 1 },
  { id: "nj_newark_001", street: "412 Springfield Ave", city: "Newark", state: "NJ", zip: "07103", county: "Essex", fips: "34013", price: 245_000, type: "single_family", bedrooms: 3, bathrooms: 1, sqft: 1200, year_built: 1955, dom: 12, rent_mid: 1950, condition: "moderate", primary_source: "zillow", section8: { fmr: 2080, waitlist: 3200 } },
  { id: "nj_paterson_001", street: "23 Market St", city: "Paterson", state: "NJ", zip: "07501", county: "Passaic", fips: "34031", price: 210_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 1800, year_built: 1942, dom: 8, rent_mid: 2400, condition: "moderate", primary_source: "attom", section8: { fmr: 2650, waitlist: 1850 } },
  { id: "nj_camden_001", street: "88 Cooper St", city: "Camden", state: "NJ", zip: "08102", county: "Camden", fips: "34007", price: 125_000, type: "single_family", bedrooms: 3, bathrooms: 1, sqft: 1050, year_built: 1928, dom: 67, rent_mid: 1450, condition: "unknown", section8: { fmr: 1620, waitlist: 650 } },
  { id: "nj_jc_001", street: "501 Grove St", city: "Jersey City", state: "NJ", zip: "07302", county: "Hudson", fips: "34017", price: 725_000, type: "condo", bedrooms: 2, bathrooms: 2, sqft: 1100, year_built: 2008, dom: 32, rent_mid: 3200, hoa: 425, condition: "strong", primary_source: "zillow", secondary_source: "propstream" },
  { id: "nj_cherry_001", street: "18 Chapel Ave", city: "Cherry Hill", state: "NJ", zip: "08002", county: "Camden", fips: "34007", price: 385_000, type: "single_family", bedrooms: 4, bathrooms: 2.5, sqft: 2100, year_built: 1972, dom: 28, rent_mid: 2650, condition: "strong" },
  // ── PA ──────────────────────────────────────────────────────────────────
  { id: "pa_phl_001", street: "1847 N 6th St", city: "Philadelphia", state: "PA", zip: "19122", county: "Philadelphia", fips: "42101", price: 280_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 2100, year_built: 1942, dom: 31, rent_mid: 2900, condition: "strong", primary_source: "propstream", secondary_source: "zillow", price_conflict_pct: 0.04 },
  { id: "pa_phl_002", street: "2230 Fitzwater St", city: "Philadelphia", state: "PA", zip: "19146", county: "Philadelphia", fips: "42101", price: 485_000, type: "townhouse", bedrooms: 3, bathrooms: 2, sqft: 1450, year_built: 1910, dom: 14, rent_mid: 2650, condition: "strong", primary_source: "zillow" },
  { id: "pa_phl_003", street: "5412 Chester Ave", city: "Philadelphia", state: "PA", zip: "19143", county: "Philadelphia", fips: "42101", price: 195_000, type: "triplex", bedrooms: 6, bathrooms: 3, sqft: 2800, year_built: 1935, dom: 9, rent_mid: 3600, condition: "moderate", primary_source: "attom", section8: { fmr: 3840, waitlist: 2400 } },
  { id: "pa_pitt_001", street: "5801 Penn Ave", city: "Pittsburgh", state: "PA", zip: "15206", county: "Allegheny", fips: "42003", price: 165_000, type: "single_family", bedrooms: 3, bathrooms: 1.5, sqft: 1400, year_built: 1948, dom: 21, rent_mid: 1750, condition: "moderate" },
  { id: "pa_pitt_002", street: "4812 Centre Ave", city: "Pittsburgh", state: "PA", zip: "15213", county: "Allegheny", fips: "42003", price: 420_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 2200, year_built: 1965, dom: 38, rent_mid: 2800, condition: "strong", primary_source: "zillow", secondary_source: "attom", price_conflict_pct: 0.13 },
  { id: "pa_reading_001", street: "412 Spruce St", city: "Reading", state: "PA", zip: "19602", county: "Berks", fips: "42011", price: 195_000, type: "triplex", bedrooms: 6, bathrooms: 3, sqft: 3100, year_built: 1955, dom: 19, rent_mid: 3450, condition: "moderate" },
  { id: "pa_allentown_001", street: "127 Turner St", city: "Allentown", state: "PA", zip: "18102", county: "Lehigh", fips: "42077", price: 220_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 1950, year_built: 1958, dom: 42, rent_mid: 2350 },
  { id: "pa_lancaster_001", street: "45 Prince St", city: "Lancaster", state: "PA", zip: "17603", county: "Lancaster", fips: "42071", price: 340_000, type: "single_family", bedrooms: 4, bathrooms: 2, sqft: 1850, year_built: 1982, dom: 15, rent_mid: 2200, condition: "strong" },
  // ── NY ──────────────────────────────────────────────────────────────────
  { id: "ny_bk_001", street: "412 Ocean Pkwy", city: "Brooklyn", state: "NY", zip: "11218", county: "Kings", fips: "36047", price: 1_250_000, type: "townhouse", bedrooms: 4, bathrooms: 3, sqft: 2400, year_built: 1925, dom: 44, rent_mid: 4800, condition: "strong", primary_source: "zillow", secondary_source: "propstream" },
  { id: "ny_queens_001", street: "85-22 37th Ave", city: "Queens", state: "NY", zip: "11372", county: "Queens", fips: "36081", price: 875_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 1900, year_built: 1948, dom: 28, rent_mid: 3800, condition: "moderate" },
  { id: "ny_buffalo_001", street: "215 Elmwood Ave", city: "Buffalo", state: "NY", zip: "14222", county: "Erie", fips: "36029", price: 145_000, type: "single_family", bedrooms: 3, bathrooms: 1, sqft: 1350, year_built: 1930, dom: 52, rent_mid: 1500, condition: "unknown" },
  { id: "ny_rochester_001", street: "1012 Monroe Ave", city: "Rochester", state: "NY", zip: "14620", county: "Monroe", fips: "36055", price: 185_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 2000, year_built: 1947, dom: 18, rent_mid: 2100, condition: "moderate", section8: { fmr: 2280, waitlist: 980 } },
  { id: "ny_syracuse_001", street: "322 Westcott St", city: "Syracuse", state: "NY", zip: "13210", county: "Onondaga", fips: "36067", price: 135_000, type: "single_family", bedrooms: 3, bathrooms: 1.5, sqft: 1420, year_built: 1925, dom: 31, rent_mid: 1550, condition: "unknown" },
  // ── TX ──────────────────────────────────────────────────────────────────
  { id: "tx_hou_001", street: "4512 Montrose Blvd", city: "Houston", state: "TX", zip: "77006", county: "Harris", fips: "48201", price: 385_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1750, year_built: 1972, dom: 19, rent_mid: 2400, condition: "strong", is_coastal: true, primary_source: "zillow", secondary_source: "attom" },
  { id: "tx_hou_002", street: "8120 Bissonnet St", city: "Houston", state: "TX", zip: "77074", county: "Harris", fips: "48201", price: 195_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 1800, year_built: 1985, dom: 25, rent_mid: 2300, condition: "moderate" },
  { id: "tx_sa_001", street: "215 Probandt St", city: "San Antonio", state: "TX", zip: "78210", county: "Bexar", fips: "48029", price: 165_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1400, year_built: 1962, dom: 12, rent_mid: 1650, condition: "moderate" },
  { id: "tx_dallas_001", street: "3812 McKinney Ave", city: "Dallas", state: "TX", zip: "75204", county: "Dallas", fips: "48113", price: 525_000, type: "single_family", bedrooms: 4, bathrooms: 3, sqft: 2200, year_built: 1998, dom: 22, rent_mid: 2950, condition: "strong" },
  { id: "tx_austin_001", street: "1200 E 11th St", city: "Austin", state: "TX", zip: "78702", county: "Travis", fips: "48453", price: 685_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1600, year_built: 2006, dom: 7, rent_mid: 3200, condition: "strong", primary_source: "zillow" },
  // ── FL ──────────────────────────────────────────────────────────────────
  { id: "fl_miami_001", street: "725 NW 27th Ave", city: "Miami", state: "FL", zip: "33125", county: "Miami-Dade", fips: "12086", price: 415_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1450, year_built: 1958, dom: 35, rent_mid: 2600, condition: "moderate", is_coastal: true, primary_source: "attom" },
  { id: "fl_tampa_001", street: "4102 N Florida Ave", city: "Tampa", state: "FL", zip: "33603", county: "Hillsborough", fips: "12057", price: 285_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1550, year_built: 1985, dom: 18, rent_mid: 2200, condition: "strong", is_coastal: true },
  { id: "fl_orl_001", street: "812 Edgewater Dr", city: "Orlando", state: "FL", zip: "32804", county: "Orange", fips: "12095", price: 245_000, type: "single_family", bedrooms: 3, bathrooms: 1.5, sqft: 1380, year_built: 1976, dom: 23, rent_mid: 1950, condition: "moderate" },
  { id: "fl_jax_001", street: "1815 Riverside Ave", city: "Jacksonville", state: "FL", zip: "32204", county: "Duval", fips: "12031", price: 175_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 1700, year_built: 1968, dom: 41, rent_mid: 1900, condition: "moderate" },
  // ── GA ──────────────────────────────────────────────────────────────────
  { id: "ga_atl_001", street: "825 Ponce de Leon Ave NE", city: "Atlanta", state: "GA", zip: "30306", county: "Fulton", fips: "13121", price: 465_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1850, year_built: 1922, dom: 16, rent_mid: 2750, condition: "strong", primary_source: "zillow" },
  { id: "ga_atl_002", street: "1412 Memorial Dr SE", city: "Atlanta", state: "GA", zip: "30317", county: "DeKalb", fips: "13089", price: 215_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1400, year_built: 1955, dom: 29, rent_mid: 1900, condition: "moderate", section8: { fmr: 2050, waitlist: 1420 } },
  { id: "ga_savannah_001", street: "125 W Jones St", city: "Savannah", state: "GA", zip: "31401", county: "Chatham", fips: "13051", price: 385_000, type: "townhouse", bedrooms: 3, bathrooms: 2, sqft: 1600, year_built: 1890, dom: 68, rent_mid: 2200, condition: "strong", is_coastal: true },
  // ── NC ──────────────────────────────────────────────────────────────────
  { id: "nc_char_001", street: "2315 The Plaza", city: "Charlotte", state: "NC", zip: "28205", county: "Mecklenburg", fips: "37119", price: 365_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1650, year_built: 1968, dom: 14, rent_mid: 2250, condition: "strong" },
  { id: "nc_raleigh_001", street: "812 Glenwood Ave", city: "Raleigh", state: "NC", zip: "27603", county: "Wake", fips: "37183", price: 425_000, type: "single_family", bedrooms: 4, bathrooms: 2.5, sqft: 2000, year_built: 1992, dom: 11, rent_mid: 2600, condition: "strong" },
  { id: "nc_durham_001", street: "1215 Broad St", city: "Durham", state: "NC", zip: "27705", county: "Durham", fips: "37063", price: 285_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1500, year_built: 1948, dom: 17, rent_mid: 2100, condition: "moderate" },
  // ── OH ──────────────────────────────────────────────────────────────────
  { id: "oh_cle_001", street: "3822 W 25th St", city: "Cleveland", state: "OH", zip: "44109", county: "Cuyahoga", fips: "39035", price: 105_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 1900, year_built: 1938, dom: 44, rent_mid: 1700, condition: "moderate", section8: { fmr: 1950, waitlist: 780 } },
  { id: "oh_col_001", street: "1450 Summit St", city: "Columbus", state: "OH", zip: "43201", county: "Franklin", fips: "39049", price: 195_000, type: "single_family", bedrooms: 3, bathrooms: 1.5, sqft: 1350, year_built: 1962, dom: 9, rent_mid: 1850, condition: "strong" },
  { id: "oh_cin_001", street: "1715 Vine St", city: "Cincinnati", state: "OH", zip: "45202", county: "Hamilton", fips: "39061", price: 225_000, type: "triplex", bedrooms: 6, bathrooms: 3, sqft: 2600, year_built: 1908, dom: 52, rent_mid: 2900, condition: "moderate" },
  // ── TN ──────────────────────────────────────────────────────────────────
  { id: "tn_nash_001", street: "2412 Belmont Blvd", city: "Nashville", state: "TN", zip: "37212", county: "Davidson", fips: "47037", price: 585_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1750, year_built: 1926, dom: 13, rent_mid: 3100, condition: "strong", primary_source: "zillow", secondary_source: "propstream" },
  { id: "tn_mem_001", street: "1815 Cooper St", city: "Memphis", state: "TN", zip: "38104", county: "Shelby", fips: "47157", price: 165_000, type: "duplex", bedrooms: 4, bathrooms: 2, sqft: 1850, year_built: 1945, dom: 31, rent_mid: 1950, condition: "moderate" },
  { id: "tn_mem_002", street: "3215 Summer Ave", city: "Memphis", state: "TN", zip: "38112", county: "Shelby", fips: "47157", price: 85_000, type: "single_family", bedrooms: 2, bathrooms: 1, sqft: 900, year_built: 1952, dom: 78, rent_mid: 1150, condition: "unknown", section8: { fmr: 1280, waitlist: 580 } },
  // ── IN ──────────────────────────────────────────────────────────────────
  { id: "in_indy_001", street: "2512 College Ave", city: "Indianapolis", state: "IN", zip: "46205", county: "Marion", fips: "18097", price: 155_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1400, year_built: 1960, dom: 8, rent_mid: 1750, condition: "strong" },
  { id: "in_indy_002", street: "1820 E Washington St", city: "Indianapolis", state: "IN", zip: "46201", county: "Marion", fips: "18097", price: 95_000, type: "single_family", bedrooms: 2, bathrooms: 1, sqft: 950, year_built: 1948, dom: 155, rent_mid: 1250, condition: "unknown", section8: { fmr: 1380, waitlist: 420 } },
  // ── High-end ────────────────────────────────────────────────────────────
  { id: "ny_manh_001", street: "215 E 73rd St #4B", city: "Manhattan", state: "NY", zip: "10021", county: "New York", fips: "36061", price: 2_350_000, type: "condo", bedrooms: 2, bathrooms: 2, sqft: 1100, year_built: 2015, dom: 89, rent_mid: 6800, hoa: 1850, condition: "strong", primary_source: "zillow", secondary_source: "propstream" },
  { id: "ca_la_negative", street: "1512 Sunset Blvd", city: "Los Angeles", state: "CA", zip: "90026", county: "Los Angeles", fips: "06037", price: 985_000, type: "single_family", bedrooms: 3, bathrooms: 2, sqft: 1450, year_built: 1978, dom: 62, rent_mid: 3200, condition: "moderate" },
];

// ───────────────────────────────────────────────────────────────────────────

export const mockFeedProperties: FeedProperty[] = SEEDS.map(buildProperty);

// Fill comp_count_total from the breakdown sum
mockFeedProperties.forEach((p) => {
  p.rent_estimate.units.forEach((u) => {
    u.comp_count_total = u.sources_breakdown.reduce((sum, s) => sum + s.comp_count, 0);
  });
});

export const mockProperty: FeedProperty = clone(mockFeedProperties[0]);
