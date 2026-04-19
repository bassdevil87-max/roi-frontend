"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Microscope, X } from "lucide-react";
import { storage, STORAGE_KEYS } from "@/lib/storage";

/**
 * Shown once per user (tracked in localStorage) to introduce the expert mode
 * feature. Sits below the nav and points at the Expert toggle.
 *
 * Dismisses on:
 *   - User taps the close button
 *   - User toggles expert mode (we know they found it)
 *   - 15 seconds auto-dismiss
 *   - Second page load (one-shot)
 */
export function ExpertModeHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if the user hasn't seen it yet
    const seen = storage.get<boolean>("expert_mode_hint_seen");
    const expertActive = storage.get<boolean>(STORAGE_KEYS.expert_mode);

    // Skip if already seen OR if expert mode is already on (user knows about it)
    if (seen === true || expertActive === true) return;

    // Show after a small delay so the page settles first
    const showTimer = setTimeout(() => setVisible(true), 1200);
    // Auto-dismiss after 15s
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      storage.set("expert_mode_hint_seen", true);
    }, 15_000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  // Also dismiss if user toggles expert mode (we know they found it)
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      const expertActive = storage.get<boolean>(STORAGE_KEYS.expert_mode);
      if (expertActive === true) {
        setVisible(false);
        storage.set("expert_mode_hint_seen", true);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [visible]);

  const handleDismiss = () => {
    setVisible(false);
    storage.set("expert_mode_hint_seen", true);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-2 p-3 bg-signal-bg/70 border border-signal/30 rounded-xl relative"
        >
          <div className="w-7 h-7 rounded-full bg-signal/15 flex items-center justify-center flex-shrink-0">
            <Microscope className="w-3.5 h-3.5 text-signal" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0 pr-5">
            <div className="text-[12px] font-semibold text-ink leading-tight mb-0.5">
              Tip: Expert mode reveals the sources
            </div>
            <div className="text-[11px] text-ink-secondary leading-snug">
              Toggle it on to see which APIs contributed to each number and how confident we are in each.
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/60"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3 text-ink-secondary" strokeWidth={2.2} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
