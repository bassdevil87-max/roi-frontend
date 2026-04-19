"use client";

import { ArrowLeft, Bookmark, Share, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: React.ReactNode;
  variant?: "transparent" | "solid";
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  showBack = true,
  right,
  variant = "solid",
  className,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "flex items-center justify-between h-12 px-3",
        variant === "transparent" ? "bg-transparent" : "bg-white",
        className
      )}
    >
      <div className="w-10 flex items-center">
        {showBack && (
          <button
            onClick={onBack || (() => router.back())}
            aria-label="Back"
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full",
              "transition-colors",
              variant === "transparent"
                ? "bg-white/80 backdrop-blur-md hover:bg-white"
                : "hover:bg-paper-card"
            )}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
        )}
      </div>

      {(title || subtitle) && (
        <div className="flex-1 text-center px-2 min-w-0">
          {title && (
            <div className="text-[15px] font-semibold truncate">{title}</div>
          )}
          {subtitle && (
            <div className="text-[11px] text-ink-secondary truncate">
              {subtitle}
            </div>
          )}
        </div>
      )}

      <div className="w-10 flex items-center justify-end">{right}</div>
    </header>
  );
}

export function HeaderIconButton({
  icon,
  onClick,
  variant = "solid",
  ariaLabel,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  variant?: "transparent" | "solid";
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "w-10 h-10 flex items-center justify-center rounded-full transition-colors",
        variant === "transparent"
          ? "bg-white/80 backdrop-blur-md hover:bg-white"
          : "hover:bg-paper-card"
      )}
    >
      {icon}
    </button>
  );
}

export { Bookmark, Share, Heart };
