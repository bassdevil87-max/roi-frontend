"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBar } from "@/components/ui/StatusBar";
import { Check, Loader2, Sparkles } from "lucide-react";
import { mockFeedProperties } from "@/lib/mock-data";
import { readThesisFromStorage, scoreAgainstThesis } from "@/lib/thesis-match";

const STEPS = [
  { label: "Scanning 12,400+ MLS listings", duration: 1100 },
  { label: "Pulling property taxes and permits", duration: 900 },
  { label: "Estimating rent from 4 data sources", duration: 1100 },
  { label: "Calculating cash flow for each property", duration: 900 },
  { label: "Scoring against your thesis", duration: 800 },
];

type Phase = "scanning" | "revealing";

export default function ScanningPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [listingsScanned, setListingsScanned] = useState(0);
  const [phase, setPhase] = useState<Phase>("scanning");

  // Compute actual match count from thesis (preview what feed will show)
  const matchCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    const thesis = readThesisFromStorage();
    if (!thesis) return mockFeedProperties.length;
    return mockFeedProperties.filter((p) => scoreAgainstThesis(p, thesis).passes).length;
  }, []);

  // Step progression
  useEffect(() => {
    if (currentStep < STEPS.length) {
      const timeout = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, STEPS[currentStep].duration);
      return () => clearTimeout(timeout);
    } else {
      // All steps complete — transition to reveal phase
      const revealTimeout = setTimeout(() => {
        setPhase("revealing");
      }, 300);
      // Then navigate after reveal lingers
      const navTimeout = setTimeout(() => {
        router.push("/feed");
      }, 2400);
      return () => {
        clearTimeout(revealTimeout);
        clearTimeout(navTimeout);
      };
    }
  }, [currentStep, router]);

  // Count-up animation
  useEffect(() => {
    const target = 12_487;
    const duration = 4300;
    const increment = target / (duration / 50);
    const interval = setInterval(() => {
      setListingsScanned((prev) => {
        const next = prev + increment;
        if (next >= target) {
          clearInterval(interval);
          return target;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <StatusBar />

      <div className="flex-1 flex flex-col min-h-[calc(100dvh-44px)]">
        <AnimatePresence mode="wait">
          {phase === "scanning" ? (
            <ScanningPhase
              key="scanning"
              currentStep={currentStep}
              listingsScanned={listingsScanned}
            />
          ) : (
            <RevealPhase key="reveal" matchCount={matchCount} />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ─── Scanning phase ──────────────────────────────────────────────────────────

function ScanningPhase({
  currentStep,
  listingsScanned,
}: {
  currentStep: number;
  listingsScanned: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Animated orb */}
        <div className="relative w-32 h-32 mb-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
            className="absolute inset-0"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-money via-money-light to-signal blur-xl opacity-40" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            className="absolute inset-4 rounded-full bg-gradient-to-br from-money to-signal shadow-card flex items-center justify-center"
          >
            <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={2.5} />
          </motion.div>
        </div>

        <h1 className="font-display text-[28px] font-semibold text-center leading-tight tracking-tight mb-2">
          Building your feed...
        </h1>
        <p className="text-[14px] text-ink-secondary text-center mb-1 tabular">
          {Math.floor(listingsScanned).toLocaleString()} listings analyzed
        </p>
        <p className="text-[12px] text-ink-tertiary text-center mb-10">
          This takes about 10 seconds
        </p>

        <div className="w-full max-w-sm space-y-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i <= currentStep ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  i < currentStep
                    ? "bg-money text-white"
                    : i === currentStep
                    ? "bg-signal text-white"
                    : "bg-paper-card text-ink-tertiary"
                }`}
              >
                {i < currentStep ? (
                  <Check className="w-3 h-3" strokeWidth={3} />
                ) : i === currentStep ? (
                  <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.5} />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
              <span
                className={`text-[13px] transition-colors ${
                  i <= currentStep ? "text-ink font-medium" : "text-ink-tertiary"
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">
        <p className="text-[11px] text-ink-tertiary text-center">
          Most of our API cost goes to running expensive enrichment. We only run it on the 5% of listings that survive the free filters.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Reveal phase ────────────────────────────────────────────────────────────

function RevealPhase({ matchCount }: { matchCount: number }) {
  const [displayedMatchCount, setDisplayedMatchCount] = useState(0);

  // Quick count-up for the match number
  useEffect(() => {
    const target = matchCount;
    if (target === 0) return;
    const duration = 900;
    const increment = Math.max(1, target / (duration / 30));
    const interval = setInterval(() => {
      setDisplayedMatchCount((prev) => {
        const next = prev + increment;
        if (next >= target) {
          clearInterval(interval);
          return target;
        }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [matchCount]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col items-center justify-center px-6"
    >
      {/* Success glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
        className="relative w-32 h-32 mb-8"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-money via-money-light to-signal blur-2xl opacity-30" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-money to-money-light shadow-card flex items-center justify-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.35 }}
          >
            <Sparkles className="w-10 h-10 text-white" strokeWidth={2.5} />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-center"
      >
        <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider mb-3">
          Scan complete
        </div>
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className="font-display text-[56px] font-semibold leading-none tracking-tight tabular text-money">
            {Math.round(displayedMatchCount)}
          </span>
        </div>
        <div className="font-display text-[22px] font-semibold leading-tight mb-3">
          {matchCount === 1 ? "property matches" : "properties match"}
          <br />
          your thesis
        </div>
        <p className="text-[13px] text-ink-secondary max-w-[300px] mx-auto leading-relaxed">
          Opening your feed...
        </p>
      </motion.div>
    </motion.div>
  );
}
