"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If the user already set up a thesis in this session, send them straight to the feed.
    // Otherwise start the onboarding flow.
    const hasThesis = typeof window !== "undefined" && !!sessionStorage.getItem("thesis_goal");
    const destination = hasThesis ? "/feed" : "/onboarding";

    // Small delay so the splash doesn't flash too fast
    const t = setTimeout(() => router.replace(destination), 400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-5"
      >
        <div className="font-display text-[40px] font-semibold leading-none tracking-tight">
          ROI<span className="text-money">.</span>
        </div>
        <Loader2 className="w-5 h-5 text-ink-tertiary animate-spin" strokeWidth={2.5} />
        <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-medium">
          Loading your feed
        </div>
      </motion.div>
    </div>
  );
}
