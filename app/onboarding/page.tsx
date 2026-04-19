"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { StatusBar } from "@/components/ui/StatusBar";
import { TrendingUp, ShieldCheck, Zap } from "lucide-react";

export default function OnboardingLanding() {
  return (
    <>
      <StatusBar />

      <div className="flex-1 flex flex-col min-h-[calc(100dvh-44px)]">
        <div className="px-6 pt-12 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-1.5 bg-money-bg text-money text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-money animate-pulse" />
              20 data sources · Updated daily
            </div>
            <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-tight mb-4">
              Real estate
              <br />
              <span className="text-money">that pays</span>
              <br />
              you back.
            </h1>
            <p className="text-[15px] text-ink-secondary leading-relaxed max-w-[320px]">
              We score every listing against your thesis, surface only the deals that cash-flow, and show the work. You decide.
            </p>
          </motion.div>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-3 mb-8"
          >
            <Feature
              icon={<TrendingUp className="w-4 h-4" strokeWidth={2} />}
              title="Pre-scored cash flow"
              subtitle="NOI, cap rate, and cash-on-cash — calculated live"
            />
            <Feature
              icon={<ShieldCheck className="w-4 h-4" strokeWidth={2} />}
              title="Risks, flagged upfront"
              subtitle="FEMA zones, climate, permits, eviction rates"
            />
            <Feature
              icon={<Zap className="w-4 h-4" strokeWidth={2} />}
              title="Every number is traceable"
              subtitle="Tap any data point to see which API it came from"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="px-6 pb-8 space-y-2"
        >
          <Link href="/onboarding/phone" className="block">
            <Button variant="dark" size="l" fullWidth>
              Get started
            </Button>
          </Link>
          <p className="text-[11px] text-ink-tertiary text-center">
            By continuing, you agree to our{" "}
            <span className="underline">Terms</span> and{" "}
            <span className="underline">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </>
  );
}

function Feature({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-10 h-10 rounded-xl bg-money-bg flex items-center justify-center text-money flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[14px] font-semibold leading-tight">{title}</div>
        <div className="text-[12px] text-ink-secondary mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}
