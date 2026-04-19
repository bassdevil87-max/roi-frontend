"use client";

import { useEffect, useState, useCallback } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";

/**
 * Tracks which properties the user has saved (heart-tapped).
 * Persists to localStorage. Used by both the feed cards and the property hero.
 */
export function useSavedProperties() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const existing = storage.get<string[]>(STORAGE_KEYS.saved_properties) ?? [];
    setSavedIds(existing);
    setIsMounted(true);
  }, []);

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const toggle = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      storage.set(STORAGE_KEYS.saved_properties, next);
      return next;
    });
  }, []);

  return { savedIds, isSaved, toggle, isMounted };
}
