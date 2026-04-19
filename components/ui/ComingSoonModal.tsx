"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useSwipeToDismiss } from "@/lib/useSwipeToDismiss";

interface ComingSoonModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  features?: string[];
}

export function ComingSoonModal({
  open,
  onClose,
  title,
  description,
  features,
}: ComingSoonModalProps) {
  const swipe = useSwipeToDismiss({ onDismiss: onClose });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: swipe.dragY, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            {...swipe.props}
            className="w-full max-w-[min(430px,100%)] bg-white rounded-t-[28px] sm:rounded-[28px] pt-4 pb-8 px-6 shadow-2xl touch-pan-y"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-3 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-paper-stroke" />
            </div>

            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-signal bg-signal-bg/60 px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">
                  <Sparkles className="w-2.5 h-2.5" strokeWidth={2.5} />
                  Coming in v2
                </div>
                <h2 className="font-display text-[22px] font-semibold leading-tight">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-paper-card flex items-center justify-center flex-shrink-0 -mt-1 -mr-2"
                aria-label="Close"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <p className="text-[13px] text-ink-secondary leading-relaxed mb-4">
              {description}
            </p>

            {features && features.length > 0 && (
              <ul className="space-y-2 mb-5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-ink-secondary">
                    <span className="w-1 h-1 rounded-full bg-ink-tertiary flex-shrink-0 mt-2" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={onClose}
              className="w-full h-11 rounded-full bg-ink text-white text-[13px] font-semibold hover:bg-ink/90 transition-colors"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
