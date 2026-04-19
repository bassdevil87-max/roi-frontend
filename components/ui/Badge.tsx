import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

type BadgeVariant =
  | "low-risk"
  | "medium-risk"
  | "high-risk"
  | "high-cost"
  | "verified"
  | "section8"
  | "tenant-in-place"
  | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  "low-risk": "bg-money-bg text-money",
  "medium-risk": "bg-warn-bg text-warn",
  "high-risk": "bg-danger-bg text-danger",
  "high-cost": "bg-danger-bg text-danger",
  "verified": "bg-signal-bg text-signal",
  "section8": "bg-money-bg text-money",
  "tenant-in-place": "bg-money-bg text-money",
  "neutral": "bg-paper-card text-ink-secondary",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span className={cn("pill", variantStyles[variant], className)}>
      {variant === "verified" && (
        <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
      )}
      {children}
    </span>
  );
}
