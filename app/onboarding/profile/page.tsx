"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBar } from "@/components/ui/StatusBar";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Camera } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");

  const canContinue = first.length >= 1 && last.length >= 1 && /.+@.+/.test(email);

  return (
    <>
      <StatusBar />
      <AppHeader />

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
          onClick={() => router.push("/thesis/goal")}
        >
          Continue
        </Button>
      </div>
    </>
  );
}
