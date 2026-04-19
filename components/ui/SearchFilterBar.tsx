"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFilterBarProps {
  open: boolean;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  placeholder?: string;
}

/**
 * Expanding search field that appears inline in the feed header when
 * triggered. Filters property cards by address/city as the user types.
 */
export function SearchFilterBar({
  open,
  value,
  onChange,
  onClose,
  placeholder = "Search by address or city",
}: SearchFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Focus on open, after animation settles
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onChange("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" strokeWidth={2} />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn("input-base pl-11 pr-11 h-11")}
            />
            <button
              onClick={() => {
                onChange("");
                onClose();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-paper-card flex items-center justify-center hover:bg-paper-stroke"
              aria-label="Close search"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
          {value && (
            <p className="text-[10px] text-ink-tertiary mt-1 ml-1">
              Filtering feed by &ldquo;{value}&rdquo;. Press Esc to clear.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
