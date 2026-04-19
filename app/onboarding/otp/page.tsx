"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { StatusBar } from "@/components/ui/StatusBar";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";

export default function OTPPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const handleChange = (i: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = pasted.split("").concat(Array(6 - pasted.length).fill(""));
    setDigits(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const allFilled = digits.every((d) => d !== "");

  const handleContinue = () => {
    if (allFilled) router.push("/onboarding/profile");
  };

  // Auto-advance when all digits are entered
  useEffect(() => {
    if (allFilled) {
      const t = setTimeout(handleContinue, 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFilled]);

  return (
    <>
      <StatusBar />
      <AppHeader />

      <div className="px-6 pt-2">
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight mb-2">
          Enter the code
        </h1>
        <p className="text-[14px] text-ink-secondary leading-relaxed mb-8">
          We sent a 6-digit code to your phone. Enter it below to verify.
        </p>

        <div className="flex gap-2 mb-4 justify-between">
          {digits.map((d, i) => (
            <motion.input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              initial={{ scale: 0.9 }}
              animate={{ scale: d ? 1.02 : 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-12 h-14 text-center text-2xl font-semibold tabular input-base rounded-xl"
            />
          ))}
        </div>

        <div className="flex items-center justify-between mb-8">
          <span className="text-[13px] text-ink-secondary">
            Didn&apos;t receive the OTP?
          </span>
          <button className="text-[13px] font-semibold text-signal hover:text-signal-dark transition-colors">
            Resend
          </button>
        </div>

        <Button
          size="l"
          fullWidth
          disabled={!allFilled}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </>
  );
}
