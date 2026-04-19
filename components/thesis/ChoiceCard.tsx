"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ChoiceCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}

export function ChoiceCard({
  icon,
  title,
  subtitle,
  selected,
  onClick,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl p-4 transition-all duration-200 border-2",
        "active:scale-[0.99]",
        selected
          ? "border-ink bg-ink text-white"
          : "border-paper-stroke bg-white hover:border-ink/40"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[20px]",
            selected ? "bg-white/15" : "bg-paper-card"
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-[15px] font-semibold leading-tight",
              selected ? "text-white" : "text-ink"
            )}
          >
            {title}
          </div>
          <div
            className={cn(
              "text-[12px] mt-1 leading-relaxed",
              selected ? "text-white/70" : "text-ink-secondary"
            )}
          >
            {subtitle}
          </div>
        </div>
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
            selected
              ? "bg-white text-ink"
              : "border-2 border-paper-stroke"
          )}
        >
          {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}
