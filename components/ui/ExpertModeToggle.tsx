"use client";

import { motion } from "framer-motion";
import { Microscope } from "lucide-react";
import { useExpertMode } from "@/context/ExpertMode";
import { cn } from "@/lib/utils";

interface ExpertModeToggleProps {
  className?: string;
}

/**
 * Pill-style toggle that sits inline (not floating) to keep the header clean.
 * Use it in page headers on screens where expert mode is meaningful (property, feed).
 */
export function ExpertModeToggle({ className }: ExpertModeToggleProps) {
  const { expertMode, toggleExpertMode } = useExpertMode();

  return (
    <motion.button
      onClick={toggleExpertMode}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      aria-pressed={expertMode}
      aria-label={`Expert mode ${expertMode ? "on" : "off"}`}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[11px] font-semibold transition-colors",
        expertMode
          ? "bg-ink text-white hover:bg-ink/90"
          : "bg-paper-card text-ink-secondary hover:bg-paper-stroke border border-paper-stroke",
        className
      )}
    >
      <Microscope className="w-3.5 h-3.5" strokeWidth={2} />
      <span>Expert</span>
      <span
        className={cn(
          "relative inline-flex items-center w-6 h-3 rounded-full transition-colors",
          expertMode ? "bg-money" : "bg-ink-tertiary/30"
        )}
      >
        <motion.span
          animate={{ x: expertMode ? 12 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute left-0.5 inline-block w-2 h-2 rounded-full bg-white shadow-sm"
        />
      </span>
    </motion.button>
  );
}
