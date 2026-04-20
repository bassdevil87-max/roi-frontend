"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompareModeBarProps {
  selectedCount: number;
  selectedIds: string[];
  onExit: () => void;
  onClear: () => void;
}

/**
 * Floating bar shown at the bottom of the feed when compare mode is active.
 * Shows selection count and the "Compare" action button.
 */
export function CompareModeBar({
  selectedCount,
  selectedIds,
  onExit,
  onClear,
}: CompareModeBarProps) {
  const router = useRouter();
  const canCompare = selectedCount === 2;

  const handleCompare = () => {
    if (!canCompare) return;
    router.push(`/compare/${selectedIds[0]}/${selectedIds[1]}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="sticky-cta"
      >
        <div className="flex items-center gap-2 bg-ink rounded-full px-3 py-2 shadow-cardHover">
          <button
            onClick={onExit}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Exit compare mode"
          >
            <X className="w-4 h-4 text-white" strokeWidth={2.2} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-white/60 uppercase tracking-wider font-semibold leading-tight">
              Compare mode
            </div>
            <div className="text-[13px] text-white font-semibold leading-tight">
              {selectedCount === 0 && "Tap up to 2 properties"}
              {selectedCount === 1 && "1 selected · pick 1 more"}
              {selectedCount === 2 && "2 selected — ready to compare"}
            </div>
          </div>

          {selectedCount > 0 && (
            <button
              onClick={onClear}
              className="text-[11px] font-semibold text-white/70 hover:text-white px-2 transition-colors flex-shrink-0"
            >
              Clear
            </button>
          )}

          <button
            onClick={handleCompare}
            disabled={!canCompare}
            className={cn(
              "inline-flex items-center gap-1 h-9 px-4 rounded-full text-[12px] font-semibold transition-all flex-shrink-0",
              canCompare
                ? "bg-money text-white hover:bg-money-dark"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            )}
          >
            <Scale className="w-3.5 h-3.5" strokeWidth={2.2} />
            Compare
            {canCompare && <ArrowRight className="w-3 h-3" strokeWidth={2.5} />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
