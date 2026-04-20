const BASE = "https://api.hasdata.com/scrape/zillow";
 
// ─── Types ────────────────────────────────────────────────────────────────────
//
// These are a conservative subset of what HasData returns. Their actual payload
// includes 50+ fields; we only extract what the ROI frontend consumes. If new
// fields are needed later, add them here rather than accessing raw JSON.
 
export interface HasDataListing {
  zpid: string;
  detailUrl?: string;
  statusType?: string;                // "FOR_SALE" | "FOR_RENT" | "SOLD"
  statusText?: string;
  price?: string;                     // "$677,000"
  unformattedPrice?: number;          // 677000
  address?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZipcode?: string;
  beds?: number;
  baths?: number;
  area?: number;                      // square feet
  imgSrc?: string;
  latLong?: { latitude: number; longitude: number };
  flexFieldText?: string;             // "3 days on Zillow"
  hdpData?: {
    homeInfo?: {
      livingArea?: number;
      homeType?: string;              // "SINGLE_FAMILY" | "CONDO" | "TOWNHOUSE" | ...
      yearBuilt?: number;
      lotSize?: number;
      zestimate?: number;
      rentZestimate?: number;
      daysOnZillow?: number;
      taxAssessedValue?: number;
    };
  };
}
 
export interface HasDataListingResponse {
  listings?: HasDataListing[];
  zillow_listings?: HasDataListing[]; // Some responses use this key instead
  totalResultCount?: number;
  // HasData response shapes vary; these are the keys we've observed
}
 
export interface HasDataProperty {
  zpid?: string;
  url?: string;
  price?: number;
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  };
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  yearBuilt?: number;
  homeType?: string;
  zestimate?: number;
  rentZestimate?: number;
  description?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
  daysOnZillow?: number;
  taxAssessedValue?: number;
  propertyTaxRate?: number;
  hoaFee?: number;
}
 
// ─── Search parameters ────────────────────────────────────────────────────────
 
export interface SearchParams {
  keyword: string;                    // "Asbury Park, NJ" or "07712" or "Brooklyn, NY"
  type?: "forSale" | "forRent" | "sold";
  price?: { min?: number; max?: number };
  beds?: { min?: number; max?: number };
  baths?: { min?: number; max?: number };
  homeTypes?: Array<"house" | "townhouse" | "multiFamily" | "condo" | "apartment" | "manufactured" | "lot">;
  sort?: "verifiedSource" | "homesForYou" | "priceHighToLow" | "priceLowToHigh" | "newest";
}
 
// ─── In-memory cache — survives within one server instance ────────────────────
//
// Next.js spawns multiple server instances in production, so this cache isn't
// shared across them. For a proper shared cache we'd use Redis or similar.
// For our scale (personal use), per-instance is fine.
 
const CACHE_TTL_MS = 1000 * 60 * 30;  // 30 minutes
const cache = new Map<string, { data: unknown; expires: number }>();
 
function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}
 
function cacheSet(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}
 
// ─── Public API ───────────────────────────────────────────────────────────────
 
export class HasDataError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: string
  ) {
    super(message);
    this.name = "HasDataError";
  }
}
 
function getApiKey(): string {
  const key = process.env.HASDATA_API_KEY;
  if (!key) {
    throw new HasDataError(
      "HASDATA_API_KEY env var not set. Add it to .env.local to enable real listings."
    );
  }
  return key;
}
 
/**
 * Search for Zillow listings by location.
 *
 * @example
 *   const results = await searchListings({ keyword: "Brooklyn, NY", type: "forSale" });
 */
export async function searchListings(
  params: SearchParams
): Promise<HasDataListing[]> {
  const cacheKey = `search:${JSON.stringify(params)}`;
  const cached = cacheGet<HasDataListing[]>(cacheKey);
  if (cached) return cached;
 
  // Build query string
  const qs = new URLSearchParams({
    keyword: params.keyword,
    type: params.type ?? "forSale",
  });
  if (params.price?.min != null) qs.append("price[min]", String(params.price.min));
  if (params.price?.max != null) qs.append("price[max]", String(params.price.max));
  if (params.beds?.min != null) qs.append("beds[min]", String(params.beds.min));
  if (params.beds?.max != null) qs.append("beds[max]", String(params.beds.max));
  if (params.homeTypes?.length) {
    for (const t of params.homeTypes) qs.append("homeTypes", t);
  }
  if (params.sort) qs.append("sort", params.sort);
 
  const url = `${BASE}/listing?${qs.toString()}`;
 
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
      },
      // Don't let Next.js cache this at the fetch layer — we do our own caching above
      cache: "no-store",
    });
  } catch (e) {
    throw new HasDataError(
      `Network error calling HasData: ${e instanceof Error ? e.message : "unknown"}`
    );
  }
 
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new HasDataError(
      `HasData returned ${response.status}`,
      response.status,
      body
    );
  }
 
  const json: HasDataListingResponse = await response.json();
 
  // HasData's response shape varies — some endpoints return { listings: [...] },
  // others return { zillow_listings: [...] }. Handle both.
  const listings = json.listings ?? json.zillow_listings ?? [];
 
  cacheSet(cacheKey, listings);
  return listings;
}
 
/**
 * Fetch detailed data for a single property by its Zillow URL.
 *
 * @example
 *   const detail = await getPropertyByUrl("https://www.zillow.com/homedetails/...");
 */
export async function getPropertyByUrl(zillowUrl: string): Promise<HasDataProperty> {
  const cacheKey = `property:${zillowUrl}`;
  const cached = cacheGet<HasDataProperty>(cacheKey);
  if (cached) return cached;
 
  const qs = new URLSearchParams({ url: zillowUrl });
  const url = `${BASE}/property?${qs.toString()}`;
 
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
    },
    cache: "no-store",
  });
 
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new HasDataError(
      `HasData returned ${response.status}`,
      response.status,
      body
    );
  }
 
  const json: HasDataProperty = await response.json();
  cacheSet(cacheKey, json);
  return json;
}
 
/**
 * Check that the API key is configured without making a billable call.
 */
export function isConfigured(): boolean {
  return !!process.env.HASDATA_API_KEY;
}
 