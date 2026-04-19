"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
  variant?: "default" | "subtle";
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  variant = "default",
}: SegmentedProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 4,
    width: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeIdx = options.findIndex((o) => o.value === value);
    const buttons = containerRef.current.querySelectorAll("button");
    const activeBtn = buttons[activeIdx] as HTMLButtonElement | undefined;
    if (activeBtn) {
      setIndicator({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex p-1 rounded-xl w-full",
        variant === "default" ? "bg-paper-card" : "bg-paper-soft border border-paper-stroke",
        className
      )}
    >
      <motion.div
        className={cn(
          "absolute top-1 bottom-1 rounded-lg",
          variant === "default" ? "bg-signal" : "bg-white shadow-soft"
        )}
        animate={{ left: indicator.left, width: indicator.width }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "relative z-10 flex-1 px-4 py-2 text-sm font-medium",
            "transition-colors duration-150",
            opt.value === value
              ? variant === "default" ? "text-white" : "text-ink"
              : "text-ink-secondary hover:text-ink"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
