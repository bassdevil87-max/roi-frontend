import type { FeedProperty, Thesis } from "@/types/roi";
import { mockFeedProperties, mockProperty } from "./mock-data";

const API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_ROI_API_BASE || ""
    : "";

// Set USE_MOCK=1 (or leave API_BASE empty) to run the frontend without a backend.
const USE_MOCK = !API_BASE;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function getFeed(params?: {
  thesis_id?: string;
  min_match_score?: number;
  limit?: number;
}): Promise<{
  total_in_feed: number;
  properties: FeedProperty[];
  pipeline_summary: Record<string, unknown>;
}> {
  if (USE_MOCK) {
    return {
      total_in_feed: mockFeedProperties.length,
      properties: mockFeedProperties,
      pipeline_summary: {
        total_ingested: 12_480,
        passed_layer1: 2_847,
        passed_layer2: 614,
        passed_layer3_feed: mockFeedProperties.length,
      },
    };
  }

  const qs = new URLSearchParams();
  if (params?.thesis_id) qs.set("thesis_id", params.thesis_id);
  if (params?.min_match_score != null)
    qs.set("min_match_score", String(params.min_match_score));
  if (params?.limit) qs.set("limit", String(params.limit));

  return fetchJson(`/feed?${qs.toString()}`);
}

export async function getProperty(id: string): Promise<FeedProperty> {
  if (USE_MOCK) {
    const match = mockFeedProperties.find((p) => p.listing.external_id === id);
    return match || mockProperty;
  }
  return fetchJson<FeedProperty>(`/property/${encodeURIComponent(id)}`);
}

export async function createThesis(
  thesis: Partial<Thesis> & { user_id: string }
): Promise<{ thesis_id: string; status: string; message: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      thesis_id: `thesis_${Math.random().toString(36).slice(2, 10)}`,
      status: "processing",
      message: "Scanning matching properties now",
    };
  }
  return fetchJson(`/thesis`, {
    method: "POST",
    body: JSON.stringify(thesis),
  });
}
