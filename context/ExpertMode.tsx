"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface ExpertModeContextValue {
  expertMode: boolean;
  setExpertMode: (on: boolean) => void;
  toggleExpertMode: () => void;
}

const ExpertModeContext = createContext<ExpertModeContextValue | null>(null);

const STORAGE_KEY = "roi_expert_mode";

export function ExpertModeProvider({ children }: { children: ReactNode }) {
  const [expertMode, setExpertModeState] = useState(false);

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === "true") setExpertModeState(true);
    } catch {
      // ignore
    }
  }, []);

  const setExpertMode = (on: boolean) => {
    setExpertModeState(on);
    try {
      sessionStorage.setItem(STORAGE_KEY, String(on));
    } catch {
      // ignore
    }
  };

  const toggleExpertMode = () => setExpertMode(!expertMode);

  return (
    <ExpertModeContext.Provider value={{ expertMode, setExpertMode, toggleExpertMode }}>
      {children}
    </ExpertModeContext.Provider>
  );
}

export function useExpertMode(): ExpertModeContextValue {
  const ctx = useContext(ExpertModeContext);
  if (!ctx) {
    // Allow use outside provider — default to off. Useful during SSR.
    return {
      expertMode: false,
      setExpertMode: () => {},
      toggleExpertMode: () => {},
    };
  }
  return ctx;
}
