import { Badge } from "@/components/ui/Badge";
import { AIInsight } from "@/components/ui/AIInsight";
import { Calendar, Zap } from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface TenantStatusProps {
  rentMonthly: number;
  leaseActiveUntil: string;
  upfrontSavings?: number;
}

export function TenantStatus({
  rentMonthly,
  leaseActiveUntil,
  upfrontSavings = 6300,
}: TenantStatusProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold">Tenant Status</h3>
        <Badge variant="tenant-in-place">Tenant currently in place</Badge>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-ink-tertiary" strokeWidth={2} />
        <span className="text-xs text-ink-secondary font-medium">
          Tenant paying
        </span>
        <span className="text-xs text-ink-secondary ml-auto">
          Lease active until{" "}
          <span className="font-semibold text-ink">{leaseActiveUntil}</span>
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-display text-[32px] font-semibold tabular leading-none">
          {formatMoney(rentMonthly)}
        </span>
        <span className="text-sm text-ink-secondary">per month</span>
      </div>

      <div className="bg-signal-bg/60 border border-signal/20 rounded-xl p-3 mb-3">
        <div className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-md bg-signal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap className="w-3 h-3 text-signal" strokeWidth={2.5} fill="currentColor" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-signal mb-0.5">
              Income starts immediately
            </div>
            <div className="text-xs text-ink leading-relaxed">
              Saves you around{" "}
              <span className="font-semibold tabular">
                {formatMoney(upfrontSavings)}
              </span>{" "}
              in upfront costs. You skip the waiting period and start earning immediately.
            </div>
          </div>
        </div>
      </div>

      <AIInsight>
        This reduces your initial risk and makes this a smoother first investment.
      </AIInsight>
    </div>
  );
}
