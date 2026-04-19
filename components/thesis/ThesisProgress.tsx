"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ThesisProgressProps {
  current: number;
  total: number;
}

export function ThesisProgress({ current, total }: ThesisProgressProps) {
  return (
    <div className="flex gap-1.5 px-5 py-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1 bg-paper-card rounded-full overflow-hidden"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: i < current ? "100%" : i === current ? "50%" : "0%" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn("h-full", i <= current ? "bg-ink" : "bg-transparent")}
          />
        </div>
      ))}
    </div>
  );
}
