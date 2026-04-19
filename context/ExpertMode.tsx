"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";

interface ExpertModeContextValue {
  expertMode: boolean;
  setExpertMode: (on: boolean) => void;
  toggleExpertMode: () => void;
}

const ExpertModeContext = createContext<ExpertModeContextValue | null>(null);

export function ExpertModeProvider({ children }: { children: ReactNode }) {
  const [expertMode, setExpertModeState] = useState(false);

  useEffect(() => {
    const stored = storage.get<boolean>(STORAGE_KEYS.expert_mode);
    if (stored === true) setExpertModeState(true);
  }, []);

  const setExpertMode = (on: boolean) => {
    setExpertModeState(on);
    storage.set(STORAGE_KEYS.expert_mode, on);
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
    return {
      expertMode: false,
      setExpertMode: () => {},
      toggleExpertMode: () => {},
    };
  }
  return ctx;
}
