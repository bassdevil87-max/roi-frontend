"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { formatMoney } from "@/lib/utils";
import { CheckCircle2, X } from "lucide-react";

interface PropertyCTAProps {
  monthlyProfit: number;
  returnPct: number;
  tenantStatus: "ready" | "pending" | "none";
  propertyAddress?: string;
  onClick?: () => void;
}

export function PropertyCTA({
  monthlyProfit,
  returnPct,
  tenantStatus,
  propertyAddress,
  onClick,
}: PropertyCTAProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    setModalOpen(true);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setModalOpen(false);
      setSubmitted(false);
    }, 2200);
  };

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        className="sticky-cta"
      >
        {/* Row 1 — stats row (compact, responsive) */}
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="text-[15px] font-display font-semibold tabular truncate">
              {formatMoney(monthlyProfit)}
            </span>
            <span className="text-[11px] text-ink-secondary font-medium flex-shrink-0">
              /mo
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] flex-shrink-0">
            <span className="text-ink-secondary">
              <span className="font-semibold tabular text-ink">{returnPct.toFixed(1)}%</span>
              <span className="text-ink-tertiary"> return</span>
            </span>
            <span className="w-px h-2.5 bg-paper-stroke" aria-hidden />
            <span className="text-ink-secondary">
              <span
                className={
                  tenantStatus === "ready"
                    ? "font-semibold text-money"
                    : tenantStatus === "pending"
                    ? "font-semibold text-warn"
                    : "font-semibold text-ink-tertiary"
                }
              >
                {tenantStatus === "ready" ? "Tenant ready" : tenantStatus === "pending" ? "Tenant pending" : "No tenant"}
              </span>
            </span>
          </div>
        </div>

        {/* Row 2 — full-width button */}
        <Button
          variant="primary"
          size="l"
          onClick={handleClick}
          fullWidth
        >
          I want this Property
        </Button>
      </motion.div>

      {/* Interest modal */}
      <AnimatePresence>
        {modalOpen && (
          <InterestModal
            propertyAddress={propertyAddress}
            monthlyProfit={monthlyProfit}
            submitted={submitted}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Interest Modal ──────────────────────────────────────────────────────────

function InterestModal({
  propertyAddress,
  monthlyProfit,
  submitted,
  onClose,
  onSubmit,
}: {
  propertyAddress?: string;
  monthlyProfit: number;
  submitted: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
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
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="w-full max-w-[min(430px,100%)] bg-white rounded-t-[28px] sm:rounded-[28px] pt-4 pb-8 px-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — mobile */}
        <div className="flex justify-center mb-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-paper-stroke" />
        </div>

        {!submitted ? (
          <>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-semibold mb-0.5">
                  Next Step
                </div>
                <h2 className="font-display text-[22px] font-semibold leading-tight">
                  Interested in this property?
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

            {propertyAddress && (
              <div className="bg-paper-soft border border-paper-stroke rounded-xl p-3 mb-4">
                <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-medium mb-0.5">
                  Property
                </div>
                <div className="text-[13px] font-semibold truncate">{propertyAddress}</div>
                <div className="text-[12px] text-money font-semibold tabular mt-0.5">
                  {formatMoney(monthlyProfit)}/mo projected
                </div>
              </div>
            )}

            <p className="text-[13px] text-ink-secondary leading-relaxed mb-5">
              We&apos;ll have a licensed agent reach out within 24 hours to walk you through next steps — financing options, showing scheduling, and offer strategy.
            </p>

            <div className="space-y-2">
              <Button variant="primary" size="l" fullWidth onClick={onSubmit}>
                Yes, have an agent contact me
              </Button>
              <button
                onClick={onClose}
                className="w-full text-center text-[12px] text-ink-secondary hover:text-ink py-2 transition-colors font-medium"
              >
                Not yet — I want to keep looking
              </button>
            </div>

            <p className="text-[10px] text-ink-tertiary text-center mt-3 leading-relaxed">
              No commitment. You can back out anytime before signing.
            </p>
          </>
        ) : (
          <SubmittedState />
        )}
      </motion.div>
    </motion.div>
  );
}

function SubmittedState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="py-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
        className="w-14 h-14 rounded-full bg-money-bg flex items-center justify-center mx-auto mb-3"
      >
        <CheckCircle2 className="w-7 h-7 text-money" strokeWidth={2.5} />
      </motion.div>
      <h3 className="font-display text-[20px] font-semibold mb-1">We&apos;re on it</h3>
      <p className="text-[13px] text-ink-secondary max-w-[280px] mx-auto leading-relaxed">
        An agent will reach out within 24 hours. Check your email for a confirmation.
      </p>
    </motion.div>
  );
}
