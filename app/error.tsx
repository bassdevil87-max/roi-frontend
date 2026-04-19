"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

/**
 * Next.js error boundary for the entire app.
 * Triggered when any page or component in the tree throws during render.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for dev; in prod we'd hit an observability endpoint
    console.error("ROI error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-warn/10 flex items-center justify-center mx-auto mb-5"
        >
          <AlertTriangle className="w-7 h-7 text-warn" strokeWidth={2.2} />
        </motion.div>

        <h1 className="font-display text-[26px] font-semibold mb-2 leading-tight">
          Something broke
        </h1>
        <p className="text-[13px] text-ink-secondary mb-1 leading-relaxed">
          We hit an unexpected error. Try reloading — usually it&apos;s a hiccup.
        </p>

        {process.env.NODE_ENV === "development" && (
          <details className="text-left mt-4 mb-4 p-3 bg-paper-card rounded-lg">
            <summary className="text-[11px] font-semibold text-ink-secondary cursor-pointer">
              Dev details
            </summary>
            <div className="text-[10px] text-ink-tertiary mt-2 font-mono break-words">
              {error.message}
              {error.digest && <div className="mt-1">Digest: {error.digest}</div>}
            </div>
          </details>
        )}

        <div className="flex gap-2 justify-center mt-6">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-ink text-white text-[13px] font-semibold hover:bg-ink/90 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.5} />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-paper-card text-ink text-[13px] font-semibold hover:bg-paper-stroke transition-colors"
          >
            <Home className="w-3.5 h-3.5" strokeWidth={2.5} />
            Home
          </Link>
        </div>

        <p className="text-[10px] text-ink-tertiary mt-8">
          Error persists? Try clearing your browser cache or using incognito mode.
        </p>
      </motion.div>
    </div>
  );
}
