import { NextRequest, NextResponse } from "next/server";
import { searchListings, HasDataError, isConfigured } from "@/lib/hasdata";
import { enrichListings } from "@/lib/enrich";
 
// ─────────────────────────────────────────────────────────────────────────────
// GET /api/listings?keyword=Brooklyn,NY&type=forSale
//
// Server-side proxy for real Zillow listings via HasData. The HASDATA_API_KEY
// env var is read here and NEVER sent to the browser.
//
// Query params:
//   keyword   (required) — location string: "Brooklyn, NY" or "07712" or "New York, NY"
//   type      — forSale | forRent | sold (default: forSale)
//   min_price — minimum listing price
//   max_price — maximum listing price
//   min_beds  — minimum bedrooms
//
// Returns: { properties: FeedProperty[], source: "real" | "mock", count: number }
// ─────────────────────────────────────────────────────────────────────────────
 
export const runtime = "nodejs";
 
export async function GET(req: NextRequest) {
  // If HasData isn't configured, return 503 so the client knows to fall back to mock
  if (!isConfigured()) {
    return NextResponse.json(
      {
        error: "HasData not configured",
        note: "Set HASDATA_API_KEY in .env.local to enable real listings",
      },
      { status: 503 }
    );
  }
 
  const searchParams = req.nextUrl.searchParams;
  const keyword = searchParams.get("keyword");
 
  if (!keyword) {
    return NextResponse.json(
      { error: "Missing required query parameter: keyword" },
      { status: 400 }
    );
  }
 
  const type = (searchParams.get("type") ?? "forSale") as "forSale" | "forRent" | "sold";
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const minBeds = searchParams.get("min_beds");
 
  try {
    const listings = await searchListings({
      keyword,
      type,
      price: {
        ...(minPrice && { min: Number(minPrice) }),
        ...(maxPrice && { max: Number(maxPrice) }),
      },
      ...(minBeds && { beds: { min: Number(minBeds) } }),
    });
 
    const properties = enrichListings(listings);
 
    return NextResponse.json({
      source: "real",
      count: properties.length,
      properties,
    });
  } catch (e) {
    if (e instanceof HasDataError) {
      console.error("[listings] HasData error:", e.status, e.message, e.body);
      return NextResponse.json(
        {
          error: "HasData request failed",
          status: e.status,
          detail: e.message,
        },
        { status: 502 }
      );
    }
    console.error("[listings] Unexpected error:", e);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}