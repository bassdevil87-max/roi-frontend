"use client";

import { motion } from "framer-motion";
import { StatusBar } from "@/components/ui/StatusBar";

/**
 * Loading state for /property/[id] — shown during navigation.
 * Mirrors the real hero + card layout so users see structure, not a spinner.
 */
export default function PropertyLoading() {
  return (
    <>
      <StatusBar className="absolute top-0 left-0 right-0 z-20 text-white" />

      {/* Hero skeleton */}
      <div className="relative w-full h-[320px] bg-paper-card overflow-hidden">
        <div className="absolute inset-0 skeleton" />
        {/* Gradient overlay matches real hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-4">
          <div className="h-3 w-20 bg-white/30 rounded mb-2" />
          <div className="h-8 w-40 bg-white/40 rounded" />
        </div>
      </div>

      {/* Section nav skeleton */}
      <div className="sticky top-0 bg-paper-soft border-b border-paper-stroke px-5 py-2">
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-16 skeleton rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>

      <div className="px-5 pt-3 pb-32 space-y-3 bg-paper-soft">
        {/* Demo banner skeleton */}
        <div className="h-8 skeleton rounded-lg" />

        {/* Monthly profit card skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="card"
        >
          <div className="h-4 w-32 skeleton mb-2" />
          <div className="h-12 w-40 skeleton mb-3" />
          <div className="h-10 w-full skeleton rounded-lg" />
        </motion.div>

        {/* Secondary cards */}
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + i * 0.08 }}
            className="card"
          >
            <div className="h-5 w-28 skeleton mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-full skeleton" />
              <div className="h-4 w-3/4 skeleton" />
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
