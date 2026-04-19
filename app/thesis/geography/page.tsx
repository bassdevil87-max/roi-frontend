"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBar } from "@/components/ui/StatusBar";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ThesisProgress } from "@/components/thesis/ThesisProgress";
import { Search, Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { storage, STORAGE_KEYS } from "@/lib/storage";

interface StateOption {
  code: string;
  name: string;
  emoji: string;
  // Cities with enough inventory to be worth narrowing by
  cities: string[];
}

const POPULAR_STATES: StateOption[] = [
  { code: "NJ", name: "New Jersey", emoji: "🏖️", cities: ["Asbury Park", "Jersey City", "Newark", "Trenton", "Atlantic City", "Paterson", "Camden", "Cherry Hill"] },
  { code: "PA", name: "Pennsylvania", emoji: "🏙️", cities: ["Philadelphia", "Pittsburgh", "Reading", "Allentown", "Lancaster"] },
  { code: "NY", name: "New York", emoji: "🗽", cities: ["Brooklyn", "Queens", "Manhattan", "Buffalo", "Rochester", "Syracuse"] },
  { code: "TX", name: "Texas", emoji: "🤠", cities: ["Houston", "San Antonio", "Dallas", "Austin"] },
  { code: "FL", name: "Florida", emoji: "🌴", cities: ["Miami", "Tampa", "Orlando", "Jacksonville"] },
  { code: "GA", name: "Georgia", emoji: "🍑", cities: ["Atlanta", "Savannah"] },
  { code: "NC", name: "North Carolina", emoji: "🌲", cities: ["Charlotte", "Raleigh", "Durham"] },
  { code: "OH", name: "Ohio", emoji: "🏭", cities: ["Cleveland", "Columbus", "Cincinnati"] },
  { code: "TN", name: "Tennessee", emoji: "🎸", cities: ["Nashville", "Memphis"] },
  { code: "IN", name: "Indiana", emoji: "🏁", cities: ["Indianapolis"] },
];

export default function ThesisGeographyPage() {
  const router = useRouter();
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<Record<string, string[]>>({});
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Pre-fill from stored thesis
  useEffect(() => {
    const savedStates = storage.get<string[]>(STORAGE_KEYS.thesis_states);
    const savedCities = storage.get<Record<string, string[]>>(STORAGE_KEYS.thesis_cities);
    if (savedStates && savedStates.length > 0) setSelectedStates(savedStates);
    if (savedCities) setSelectedCities(savedCities);
  }, []);

  const toggleState = (code: string) => {
    setSelectedStates((prev) => {
      const isRemoving = prev.includes(code);
      const next = isRemoving ? prev.filter((c) => c !== code) : [...prev, code];
      // If removing a state, also drop its city filters
      if (isRemoving) {
        setSelectedCities((curr) => {
          const { [code]: _removed, ...rest } = curr;
          return rest;
        });
        if (expandedState === code) setExpandedState(null);
      }
      return next;
    });
  };

  const toggleCity = (stateCode: string, city: string) => {
    setSelectedCities((prev) => {
      const cities = prev[stateCode] ?? [];
      const next = cities.includes(city)
        ? cities.filter((c) => c !== city)
        : [...cities, city];
      return { ...prev, [stateCode]: next };
    });
  };

  const clearCitiesForState = (stateCode: string) => {
    setSelectedCities((prev) => {
      const { [stateCode]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const filtered = useMemo(
    () =>
      POPULAR_STATES.filter(
        (s) =>
          search === "" ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase()) ||
          s.cities.some((c) => c.toLowerCase().includes(search.toLowerCase()))
      ),
    [search]
  );

  const totalCities = Object.values(selectedCities).reduce((sum, arr) => sum + arr.length, 0);

  const handleContinue = () => {
    storage.set(STORAGE_KEYS.thesis_states, selectedStates);
    storage.set(STORAGE_KEYS.thesis_cities, selectedCities);
    router.push("/thesis/budget");
  };

  return (
    <>
      <StatusBar />
      <AppHeader />
      <ThesisProgress current={1} total={3} />

      <div className="px-5 pt-3 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5"
        >
          <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider mb-2">
            Step 2 of 3
          </div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight mb-2">
            Which markets are you investing in?
          </h1>
          <p className="text-[14px] text-ink-secondary leading-relaxed">
            Pick states first. Tap any selected state to narrow by specific cities — or leave it state-wide to see everything.
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" strokeWidth={2} />
          <input
            className="input-base pl-11"
            placeholder="Search states or cities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Selected count bar */}
        {(selectedStates.length > 0 || totalCities > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-3 px-1"
          >
            <div className="text-[11px] text-ink-secondary tabular">
              <span className="font-semibold text-ink">{selectedStates.length}</span>{" "}
              state{selectedStates.length === 1 ? "" : "s"}
              {totalCities > 0 && (
                <>
                  {" · "}
                  <span className="font-semibold text-ink">{totalCities}</span>{" "}
                  cit{totalCities === 1 ? "y" : "ies"} narrowed
                </>
              )}
            </div>
            {totalCities > 0 && (
              <button
                onClick={() => setSelectedCities({})}
                className="text-[11px] font-medium text-signal hover:text-signal-dark"
              >
                Clear city filters
              </button>
            )}
          </motion.div>
        )}

        {/* State list — now vertical with cascade, not grid */}
        <div className="space-y-2">
          {filtered.map((state, i) => {
            const isSelected = selectedStates.includes(state.code);
            const isExpanded = expandedState === state.code;
            const cityFilters = selectedCities[state.code] ?? [];
            const hasCityFilters = cityFilters.length > 0;
            return (
              <motion.div
                key={state.code}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
              >
                <div
                  className={cn(
                    "rounded-2xl transition-all border-2 overflow-hidden",
                    isSelected
                      ? "border-ink bg-white"
                      : "border-paper-stroke bg-white hover:border-ink/40"
                  )}
                >
                  {/* State row */}
                  <button
                    onClick={() => toggleState(state.code)}
                    className="w-full p-3 flex items-center gap-3 text-left"
                  >
                    <span className="text-2xl flex-shrink-0" aria-hidden>{state.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-ink leading-tight">
                        {state.name}
                      </div>
                      <div className="text-[11px] text-ink-tertiary tabular mt-0.5">
                        {state.code}
                        {hasCityFilters && ` · ${cityFilters.length} cit${cityFilters.length === 1 ? "y" : "ies"}`}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                        isSelected
                          ? "bg-ink text-white"
                          : "border-2 border-paper-stroke"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </div>
                  </button>

                  {/* Narrow by cities — only available when state is selected */}
                  {isSelected && state.cities.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedState(isExpanded ? null : state.code);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 border-t border-paper-stroke hover:bg-paper-soft transition-colors text-[12px]"
                    >
                      <span className="text-ink font-medium">
                        {hasCityFilters
                          ? `${cityFilters.length} cit${cityFilters.length === 1 ? "y" : "ies"} selected`
                          : "Narrow by city (optional)"}
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 text-ink-secondary transition-transform",
                          isExpanded && "rotate-180"
                        )}
                        strokeWidth={2}
                      />
                    </button>
                  )}

                  {/* City chips — expanded */}
                  <AnimatePresence>
                    {isSelected && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-paper-stroke"
                      >
                        <div className="p-3 bg-paper-soft">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-ink-tertiary font-semibold uppercase tracking-wider">
                              Cities in {state.name}
                            </span>
                            {hasCityFilters && (
                              <button
                                onClick={() => clearCitiesForState(state.code)}
                                className="flex items-center gap-0.5 text-[10px] font-medium text-ink-secondary hover:text-ink"
                              >
                                <X className="w-3 h-3" strokeWidth={2.5} />
                                Clear
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {state.cities.map((city) => {
                              const on = cityFilters.includes(city);
                              return (
                                <button
                                  key={city}
                                  onClick={() => toggleCity(state.code, city)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
                                    on
                                      ? "bg-ink text-white"
                                      : "bg-white border border-paper-stroke text-ink hover:border-ink/40"
                                  )}
                                >
                                  {on && <Check className="w-2.5 h-2.5 inline-block mr-1" strokeWidth={3} />}
                                  {city}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-ink-tertiary mt-2 leading-snug">
                            Leave empty to include the whole state.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="text-[14px] font-semibold text-ink mb-1">
              No states or cities match &ldquo;{search}&rdquo;
            </div>
            <div className="text-[12px] text-ink-secondary mb-3">
              Try a different spelling, or a nearby major city.
            </div>
            <button
              onClick={() => setSearch("")}
              className="text-[12px] font-semibold text-signal hover:text-signal-dark"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      <div className="sticky-cta">
        <Button
          size="l"
          fullWidth
          disabled={selectedStates.length === 0}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </>
  );
}
