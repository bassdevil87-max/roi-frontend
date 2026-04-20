"use client";

import { useState, useCallback } from "react";

export function useCompareMode() {
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggleMode = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (!next) setSelected([]);  // Clear when exiting compare mode
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        // Replace the first one — max 2 items
        return [prev[1], id];
      }
      return [...prev, id];
    });
  }, []);

  const clear = useCallback(() => setSelected([]), []);

  const exitMode = useCallback(() => {
    setEnabled(false);
    setSelected([]);
  }, []);

  const isSelected = useCallback(
    (id: string) => selected.includes(id),
    [selected]
  );

  return {
    enabled,
    selected,
    toggleMode,
    toggleSelect,
    clear,
    exitMode,
    isSelected,
    canCompare: selected.length === 2,
  };
}
