"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, X } from "lucide-react";
import { storage, STORAGE_KEYS } from "@/lib/storage";

export function SharedContextBanner() {
  const [isShared, setIsShared] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const flag = storage.get<boolean>(STORAGE_KEYS.shared_context);
    if (flag === true) setIsShared(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    storage.remove(STORAGE_KEYS.shared_context);
  };

  return (
    <AnimatePresence>
      {isShared && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 p-3 bg-signal-bg/60 border border-signal/25 rounded-xl">
            <Link2 className="w-3.5 h-3.5 text-signal flex-shrink-0" strokeWidth={2.2} />
            <span className="text-[12px] text-ink font-medium flex-1 leading-tight">
              You&apos;re viewing a property shared with you
            </span>
            <button
              onClick={handleDismiss}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-ink-secondary" strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
