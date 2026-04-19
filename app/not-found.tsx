"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-paper-card flex items-center justify-center mx-auto mb-5"
        >
          <Compass className="w-7 h-7 text-ink-secondary" strokeWidth={2} />
        </motion.div>

        <div className="font-display text-[56px] font-semibold leading-none tabular mb-2 text-ink-tertiary">
          404
        </div>
        <h1 className="font-display text-[22px] font-semibold mb-2 leading-tight">
          Page not found
        </h1>
        <p className="text-[13px] text-ink-secondary mb-6 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist, or the link has expired.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-5 h-10 rounded-full bg-ink text-white text-[13px] font-semibold hover:bg-ink/90 transition-colors"
        >
          <Home className="w-3.5 h-3.5" strokeWidth={2.5} />
          Back to home
        </Link>
      </motion.div>
    </div>
  );
}
