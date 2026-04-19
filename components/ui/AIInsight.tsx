import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface AIInsightProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
  tone?: "default" | "warm";
}

export function AIInsight({
  children,
  label = "AI Insight",
  className,
  tone = "default",
}: AIInsightProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl p-3 pl-4",
        "border border-dashed",
        tone === "default"
          ? "border-signal/30 bg-signal-bg/60"
          : "border-money/30 bg-money-bg/50",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "flex-shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center",
            tone === "default" ? "bg-signal/10" : "bg-money/10"
          )}
        >
          <Sparkles
            className={cn(
              "w-3 h-3",
              tone === "default" ? "text-signal" : "text-money"
            )}
            strokeWidth={2.25}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-[11px] font-semibold mb-0.5 uppercase tracking-wider",
              tone === "default" ? "text-signal" : "text-money"
            )}
          >
            {label}
          </div>
          <div className="text-[13px] text-ink leading-[18px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
