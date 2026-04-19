"use client";

import { motion } from "framer-motion";
import { StatusBar } from "@/components/ui/StatusBar";
import { DemoBanner } from "@/components/ui/DemoBanner";

/**
 * Loading state for /feed — shown during navigation.
 * Matches the shape of the real feed so the transition feels seamless.
 */
export default function FeedLoading() {
  return (
    <>
      <StatusBar />

      <header className="px-5 pt-2 pb-4 bg-white">
        <DemoBanner className="mb-3" />

        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-medium mb-0.5">
              Your Feed
            </div>
            <div className="h-8 w-40 skeleton mb-1" />
            <div className="h-6 w-32 skeleton" />
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-2">
            <div className="w-10 h-10 rounded-full bg-paper-card" />
            <div className="w-10 h-10 rounded-full bg-paper-card" />
          </div>
        </div>
      </header>

      <section className="px-5 pt-2 space-y-4 bg-paper-soft pb-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="bg-white rounded-card overflow-hidden border border-paper-stroke"
          >
            <div className="aspect-[16/10] skeleton" />
            <div className="p-4 space-y-2">
              <div className="h-6 w-32 skeleton" />
              <div className="h-4 w-48 skeleton" />
              <div className="flex gap-2 mt-3 pt-3 border-t border-paper-stroke">
                <div className="h-3 w-10 skeleton" />
                <div className="h-3 w-10 skeleton" />
                <div className="h-3 w-16 skeleton" />
              </div>
            </div>
          </motion.div>
        ))}
      </section>
    </>
  );
}
