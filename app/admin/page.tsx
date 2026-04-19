"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StatusBar } from "@/components/ui/StatusBar";
import { AppHeader } from "@/components/ui/AppHeader";
import { Inbox, MessageCircle, Heart, Copy, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { storage, STORAGE_KEYS } from "@/lib/storage";

interface FeedbackEntry {
  context: string;
  message: string;
  email: string;
  submitted_at: string;
  path: string;
}

export default function AdminPage() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const entries = storage.get<FeedbackEntry[]>(STORAGE_KEYS.feedback_log) ?? [];
    setFeedback(entries);
  }, [refreshKey]);

  const handleClear = () => {
    if (!confirm("Clear all local feedback?")) return;
    storage.remove(STORAGE_KEYS.feedback_log);
    setRefreshKey((k) => k + 1);
  };

  const handleCopyAll = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(feedback, null, 2));
      alert("Copied to clipboard");
    } catch {
      alert("Copy failed — check console");
      console.log(JSON.stringify(feedback, null, 2));
    }
  };

  const feedbackEntries = feedback.filter((e) => !e.context.startsWith("interest:"));
  const interestEntries = feedback.filter((e) => e.context.startsWith("interest:"));

  return (
    <>
      <StatusBar />
      <AppHeader
        title="Admin · Submissions"
        showBack
        right={
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-paper-card"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={2} />
          </button>
        }
      />

      <div className="px-5 pt-3 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5"
        >
          <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider mb-1">
            Local view
          </div>
          <h1 className="font-display text-[22px] font-semibold leading-tight mb-2">
            {feedback.length} submission{feedback.length === 1 ? "" : "s"} this session
          </h1>
          <p className="text-[12px] text-ink-secondary leading-relaxed">
            Submissions are stored locally in your browser. Email delivery happens in addition — check your inbox if Resend is configured. Data persists across visits until you clear it.
          </p>
        </motion.div>

        {feedback.length === 0 && (
          <div className="py-12 px-4 bg-white border border-paper-stroke rounded-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-paper-card flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-5 h-5 text-ink-tertiary" strokeWidth={2} />
            </div>
            <div className="text-[14px] font-semibold mb-1">No submissions yet</div>
            <div className="text-[12px] text-ink-secondary max-w-[280px] mx-auto leading-relaxed">
              When someone leaves feedback or submits interest on a property, it&apos;ll appear here.
            </div>
          </div>
        )}

        {feedback.length > 0 && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-paper-card text-[11px] font-semibold hover:bg-paper-stroke transition-colors"
              >
                <Copy className="w-3 h-3" strokeWidth={2.5} />
                Copy all as JSON
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-paper-card text-[11px] font-semibold text-danger hover:bg-danger/10 transition-colors"
              >
                <Trash2 className="w-3 h-3" strokeWidth={2.5} />
                Clear
              </button>
            </div>

            {interestEntries.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-3.5 h-3.5 text-money" strokeWidth={2.2} />
                  <h2 className="text-[13px] font-semibold">
                    Property interest ({interestEntries.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {interestEntries.map((e, i) => (
                    <SubmissionCard key={i} entry={e} icon="interest" />
                  ))}
                </div>
              </section>
            )}

            {feedbackEntries.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="w-3.5 h-3.5 text-signal" strokeWidth={2.2} />
                  <h2 className="text-[13px] font-semibold">
                    Feedback ({feedbackEntries.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {feedbackEntries.map((e, i) => (
                    <SubmissionCard key={i} entry={e} icon="feedback" />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="mt-8 pt-4 border-t border-paper-stroke">
          <Link
            href="/feed"
            className="text-[12px] font-semibold text-signal hover:text-signal-dark"
          >
            ← Back to feed
          </Link>
        </div>
      </div>
    </>
  );
}

function SubmissionCard({ entry, icon }: { entry: FeedbackEntry; icon: "interest" | "feedback" }) {
  const date = new Date(entry.submitted_at);
  const timeStr = date.toLocaleString();

  return (
    <div className="bg-white border border-paper-stroke rounded-xl p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              "pill font-semibold text-[10px]",
              icon === "interest" ? "bg-money-bg text-money" : "bg-signal-bg text-signal"
            )}
          >
            {entry.context}
          </span>
        </div>
        <span className="text-[10px] text-ink-tertiary tabular flex-shrink-0">
          {timeStr}
        </span>
      </div>
      <div className="text-[13px] text-ink leading-snug whitespace-pre-wrap mb-2">
        {entry.message}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-tertiary">
        {entry.email && (
          <span>
            <span className="font-semibold">From:</span>{" "}
            <a href={`mailto:${entry.email}`} className="text-signal hover:underline">
              {entry.email}
            </a>
          </span>
        )}
        {entry.path && (
          <span>
            <span className="font-semibold">Path:</span>{" "}
            <span className="font-mono">{entry.path}</span>
          </span>
        )}
      </div>
    </div>
  );
}
