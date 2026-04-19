"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatusBar } from "@/components/ui/StatusBar";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  { label: "Scanning 12,400+ MLS listings", duration: 1200 },
  { label: "Checking property taxes and permits", duration: 900 },
  { label: "Estimating rent from 3 data sources", duration: 1100 },
  { label: "Calculating cash flow for each property", duration: 900 },
  { label: "Scoring against your thesis", duration: 700 },
];

export default function ScanningPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [listingsScanned, setListingsScanned] = useState(0);

  useEffect(() => {
    if (currentStep < STEPS.length) {
      const timeout = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, STEPS[currentStep].duration);
      return () => clearTimeout(timeout);
    } else {
      // All steps complete — navigate to feed
      const timeout = setTimeout(() => {
        router.push("/feed");
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, router]);

  // Count-up animation for listing count
  useEffect(() => {
    const target = 12_487;
    const duration = 4500;
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

          {/* Main headline */}
          <h1 className="font-display text-[28px] font-semibold text-center leading-tight tracking-tight mb-2">
            Building your feed...
          </h1>
          <p className="text-[14px] text-ink-secondary text-center mb-1 tabular">
            {Math.floor(listingsScanned).toLocaleString()} listings analyzed
          </p>
          <p className="text-[12px] text-ink-tertiary text-center mb-10">
            This takes about 10 seconds
          </p>

          {/* Step list */}
          <div className="w-full max-w-sm space-y-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: i <= currentStep ? 1 : 0.35,
                  x: 0,
                }}
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
            Most of your cost comes from running expensive APIs. We only run them on the 5% of listings that survive our free filters.
          </p>
        </div>
      </div>
    </>
  );
}
