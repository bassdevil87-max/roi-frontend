"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBar } from "@/components/ui/StatusBar";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ChevronDown } from "lucide-react";

export default function PhonePage() {
  const router = useRouter();
  const [country] = useState({ flag: "🇺🇸", code: "+1", name: "United States" });
  const [phone, setPhone] = useState("");

  const canContinue = phone.replace(/\D/g, "").length >= 10;

  const handleContinue = () => {
    if (canContinue) router.push("/onboarding/otp");
  };

  return (
    <>
      <StatusBar />
      <AppHeader />

      <div className="px-6 pt-2">
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight mb-2">
          Enter your phone number
        </h1>
        <p className="text-[14px] text-ink-secondary leading-relaxed mb-8">
          We&apos;ll send you a one-time code via SMS to verify your number.
        </p>

        {/* Country selector */}
        <div className="mb-3">
          <label className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider mb-1.5 block">
            Country
          </label>
          <button className="w-full input-base text-left flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>{country.flag}</span>
              <span className="text-[15px]">{country.name}</span>
              <span className="text-[15px] text-ink-tertiary tabular">
                ({country.code})
              </span>
            </span>
            <ChevronDown className="w-4 h-4 text-ink-tertiary" strokeWidth={2} />
          </button>
        </div>

        {/* Phone input */}
        <div className="mb-6">
          <label className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider mb-1.5 block">
            Phone number
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 input-base w-[72px] text-center font-medium tabular">
              {country.code}
            </div>
            <input
              type="tel"
              inputMode="tel"
              autoFocus
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
              className="input-base flex-1 tabular"
            />
          </div>
        </div>

        <Button
          size="l"
          fullWidth
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </>
  );
}
