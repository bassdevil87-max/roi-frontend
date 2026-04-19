import { cn } from "@/lib/utils";

export function StatusBar({ className }: { className?: string }) {
  return (
    <div className={cn("status-bar", className)}>
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        {/* Signal bars */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          <rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="currentColor" />
          <rect x="9" y="3" width="3" height="8" rx="0.5" fill="currentColor" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor" />
        </svg>
        {/* Wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <path d="M7.5 0C4.8 0 2.4 1 0.6 2.6L1.9 3.9C3.4 2.6 5.4 1.8 7.5 1.8C9.6 1.8 11.6 2.6 13.1 3.9L14.4 2.6C12.6 1 10.2 0 7.5 0Z" />
          <path d="M7.5 3.6C5.8 3.6 4.3 4.2 3.1 5.2L4.4 6.5C5.3 5.8 6.3 5.4 7.5 5.4C8.7 5.4 9.7 5.8 10.6 6.5L11.9 5.2C10.7 4.2 9.2 3.6 7.5 3.6Z" />
          <path d="M7.5 7.2C6.7 7.2 6 7.5 5.4 7.9L7.5 10L9.6 7.9C9 7.5 8.3 7.2 7.5 7.2Z" />
        </svg>
        {/* Battery */}
        <div className="flex items-center">
          <div className="w-6 h-3 border border-current rounded-[3px] relative">
            <div className="absolute inset-0.5 bg-current rounded-[1px]" />
          </div>
          <div className="w-0.5 h-1.5 bg-current rounded-r-sm ml-0.5" />
        </div>
      </div>
    </div>
  );
}
