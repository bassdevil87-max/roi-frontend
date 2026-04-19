"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBar } from "@/components/ui/StatusBar";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Camera } from "lucide-react";
import { storage, STORAGE_KEYS } from "@/lib/storage";

export default function ProfilePage() {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");

  // Pre-fill if user has been here before
  useEffect(() => {
    const savedName = storage.get<string>(STORAGE_KEYS.onboarding_name);
    const savedEmail = storage.get<string>(STORAGE_KEYS.onboarding_email);
    if (savedName) {
      const [f, ...rest] = savedName.split(" ");
      setFirst(f || "");
      setLast(rest.join(" "));
    }
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const canContinue = first.length >= 1 && last.length >= 1 && /.+@.+/.test(email);

  const handleContinue = () => {
    if (!canContinue) return;
    storage.set(STORAGE_KEYS.onboarding_name, `${first.trim()} ${last.trim()}`.trim());
    storage.set(STORAGE_KEYS.onboarding_email, email.trim());
    storage.set(STORAGE_KEYS.onboarding_completed, true);
    router.push("/thesis/goal");
  };

  return (
    <>
      <StatusBar />
      <AppHeader />
      <OnboardingProgress current={2} total={3} />

      <div className="px-6 pt-2">
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight mb-2">
          Create your profile
        </h1>
        <p className="text-[14px] text-ink-secondary leading-relaxed mb-8">
          Your name helps us personalize your feed and alerts.
        </p>

        {/* Profile photo */}
        <button className="flex items-center gap-3 mb-8 group">
          <div className="w-16 h-16 rounded-full bg-paper-card flex items-center justify-center border-2 border-dashed border-paper-stroke group-hover:border-ink-secondary transition-colors">
            <Camera className="w-5 h-5 text-ink-tertiary" strokeWidth={2} />
          </div>
          <span className="text-sm font-medium text-signal">
            Add a profile picture
          </span>
        </button>

        <div className="space-y-4 mb-8">
          <div>
            <label className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider mb-1.5 block">
              First name
            </label>
            <input
              className="input-base"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="Alex"
              autoComplete="given-name"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider mb-1.5 block">
              Last name
            </label>
            <input
              className="input-base"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Smith"
              autoComplete="family-name"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wider mb-1.5 block">
              Email
            </label>
            <input
              className="input-base"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
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
