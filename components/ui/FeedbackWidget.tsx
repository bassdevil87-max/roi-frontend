"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { useSwipeToDismiss } from "@/lib/useSwipeToDismiss";

interface FeedbackWidgetProps {
  context?: string;
  bottomOffset?: number;
}

interface FeedbackEntry {
  context: string;
  message: string;
  email: string;
  submitted_at: string;
  path: string;
}

function saveFeedback(entry: FeedbackEntry): void {
  const existing = storage.get<FeedbackEntry[]>(STORAGE_KEYS.feedback_log) ?? [];
  existing.push(entry);
  storage.set(STORAGE_KEYS.feedback_log, existing);
}

export function FeedbackWidget({ context = "general", bottomOffset }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const swipe = useSwipeToDismiss({ onDismiss: () => handleClose() });

  // Don't render anything until client hydration — avoids SSR/CSR mismatch
  useEffect(() => setIsMounted(true), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 3) return;

    const entry: FeedbackEntry = {
      context,
      message: message.trim(),
      email: email.trim(),
      submitted_at: new Date().toISOString(),
      path: typeof window !== "undefined" ? window.location.pathname : "",
    };

    // Always save locally — source of truth even if network fails
    saveFeedback(entry);

    // Fire off notification in background. Don't await — we don't want to
    // gate the user's success feedback on the API call. Errors are silent.
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "feedback",
        payload: {
          ...entry,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      }),
    }).catch(() => {
      // Non-fatal — local copy exists, we'll recover on retry
    });

    setSubmitted(true);

    // Auto-close after the success moment
    setTimeout(() => {
      setOpen(false);
      setMessage("");
      setEmail("");
      setSubmitted(false);
    }, 1800);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form if user had started typing
    setTimeout(() => {
      if (!submitted) {
        setMessage("");
        setEmail("");
      }
    }, 200);
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Floating button — only shown when modal is closed */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            className="fixed right-4 z-30 bg-ink text-white w-11 h-11 rounded-full shadow-card flex items-center justify-center hover:bg-ink/90 transition-colors"
            style={{
              bottom: `calc(${bottomOffset ?? 24}px + var(--safe-bottom, 0px))`,
            }}
            aria-label="Send feedback"
          >
            <MessageCircle className="w-4 h-4" strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
            onClick={handleClose}
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
              {/* Drag handle — mobile */}
              <div className="flex justify-center mb-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-paper-stroke" />
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-semibold mb-0.5">
                        Feedback
                      </div>
                      <h2 className="font-display text-[22px] font-semibold leading-tight">
                        What&apos;s off here?
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-8 h-8 rounded-full bg-paper-card flex items-center justify-center flex-shrink-0 -mt-1 -mr-2"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>

                  <p className="text-[13px] text-ink-secondary leading-relaxed mb-4">
                    Spot something wrong? Numbers look off? Missing data? Tell us — we read every message.
                  </p>

                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider mb-1.5 block">
                        What happened?
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                        placeholder="The rent estimate seems low for this neighborhood..."
                        rows={4}
                        className="input-base resize-none leading-snug"
                        autoFocus
                      />
                      <div
                        className={cn(
                          "text-[10px] text-right mt-1 tabular",
                          message.length > 450 ? "text-warn" : "text-ink-tertiary"
                        )}
                      >
                        {message.length}/500
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider mb-1.5 block">
                        Email (optional — for follow-up)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input-base"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={message.trim().length < 3}
                    className={cn(
                      "w-full h-11 rounded-full text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 transition-all",
                      message.trim().length < 3
                        ? "bg-paper-card text-ink-tertiary cursor-not-allowed"
                        : "bg-ink text-white hover:bg-ink/90"
                    )}
                  >
                    <Send className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Send feedback
                  </button>

                  <p className="text-[10px] text-ink-tertiary text-center mt-3 leading-relaxed">
                    Feedback is stored locally during this demo. We&apos;ll wire it to email delivery once we have a real email service.
                  </p>
                </form>
              ) : (
                <SubmittedState />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
      <h3 className="font-display text-[20px] font-semibold mb-1">Got it, thanks</h3>
      <p className="text-[13px] text-ink-secondary max-w-[280px] mx-auto leading-relaxed">
        Your feedback helps us fix the numbers and improve the product.
      </p>
    </motion.div>
  );
}
