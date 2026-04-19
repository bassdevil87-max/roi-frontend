/**
 * ROI unified storage helper.
 *
 * Wraps localStorage (primary) and sessionStorage (fallback for private mode)
 * behind one API. All persistence across the app flows through here so we
 * never have sessionStorage and localStorage accidentally disagreeing about
 * the user's state.
 *
 * Design decisions:
 * - Keys are namespaced with "roi_" to avoid collisions with other tenants
 *   of the same domain.
 * - JSON is the default codec; primitives are wrapped in a JSON value too so
 *   reads are consistent.
 * - All operations are no-ops in SSR (no window) so callers don't have to
 *   guard each call.
 * - Failures (private browsing, quota exceeded, corrupted data) are swallowed
 *   and logged; callers get `undefined` and proceed.
 */

type Backend = {
  get: (k: string) => string | null;
  set: (k: string, v: string) => void;
  remove: (k: string) => void;
  clear: () => void;
};

const KEY_PREFIX = "roi_";

function getBackend(): Backend | null {
  if (typeof window === "undefined") return null;

  // Prefer localStorage; fall back to sessionStorage in private mode / older browsers
  try {
    const probe = "__roi_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return {
      get: (k) => window.localStorage.getItem(k),
      set: (k, v) => window.localStorage.setItem(k, v),
      remove: (k) => window.localStorage.removeItem(k),
      clear: () => window.localStorage.clear(),
    };
  } catch {
    try {
      return {
        get: (k) => window.sessionStorage.getItem(k),
        set: (k, v) => window.sessionStorage.setItem(k, v),
        remove: (k) => window.sessionStorage.removeItem(k),
        clear: () => window.sessionStorage.clear(),
      };
    } catch {
      return null;
    }
  }
}

function namespacedKey(key: string): string {
  return key.startsWith(KEY_PREFIX) ? key : `${KEY_PREFIX}${key}`;
}

export const storage = {
  get<T = unknown>(key: string): T | undefined {
    const backend = getBackend();
    if (!backend) return undefined;
    try {
      const raw = backend.get(namespacedKey(key));
      if (raw == null) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },

  set(key: string, value: unknown): void {
    const backend = getBackend();
    if (!backend) return;
    try {
      backend.set(namespacedKey(key), JSON.stringify(value));
    } catch {
      // Quota exceeded / disabled — silently ignore
    }
  },

  remove(key: string): void {
    const backend = getBackend();
    if (!backend) return;
    try {
      backend.remove(namespacedKey(key));
    } catch {
      // ignore
    }
  },

  /**
   * Read string directly without JSON parsing. Useful for migrating existing
   * sessionStorage values that aren't JSON-encoded.
   */
  getString(key: string): string | undefined {
    const backend = getBackend();
    if (!backend) return undefined;
    try {
      const raw = backend.get(namespacedKey(key));
      return raw ?? undefined;
    } catch {
      return undefined;
    }
  },

  setString(key: string, value: string): void {
    const backend = getBackend();
    if (!backend) return;
    try {
      backend.set(namespacedKey(key), value);
    } catch {
      // ignore
    }
  },

  /**
   * Has a value been saved for this key? Works for both JSON and string values.
   */
  has(key: string): boolean {
    const backend = getBackend();
    if (!backend) return false;
    try {
      return backend.get(namespacedKey(key)) !== null;
    } catch {
      return false;
    }
  },
};

// ─── Keys used across the app ─────────────────────────────────────────────────

export const STORAGE_KEYS = {
  // Onboarding
  onboarding_phone: "onboarding_phone",
  onboarding_name: "onboarding_name",
  onboarding_email: "onboarding_email",
  onboarding_completed: "onboarding_completed",

  // Thesis
  thesis_goal: "thesis_goal",
  thesis_states: "thesis_states",
  thesis_cities: "thesis_cities",
  thesis_prop_type: "thesis_prop_type",
  thesis_min_price: "thesis_min_price",
  thesis_max_price: "thesis_max_price",
  thesis_completed: "thesis_completed",

  // Sharing
  shared_context: "shared_context",
  shared_property_id: "shared_property_id",

  // Expert mode (already localStorage-like but now unified)
  expert_mode: "expert_mode",

  // Local stubs for buttons that don't have backends yet
  saved_properties: "saved_properties",

  // Feedback + notifications (still session-scoped for cleanliness)
  feedback_log: "feedback_log",

  // Scroll position memory
  feed_scroll_y: "feed_scroll_y",
} as const;
