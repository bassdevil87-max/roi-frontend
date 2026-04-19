import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(n: number, opts: { decimals?: number; sign?: boolean } = {}): string {
  const { decimals = 0, sign = false } = opts;
  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (sign && n > 0) return `+$${formatted}`;
  if (sign && n < 0) return `-$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  return `$${formatted}`;
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function formatMoneyCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toFixed(0)}`;
}

/**
 * Format large dollar amounts with commas for full detail (prices).
 */
export function formatPriceFull(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
