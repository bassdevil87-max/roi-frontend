"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { storage, STORAGE_KEYS } from "@/lib/storage";

export default function SharePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    if (!params?.id) return;
    storage.set(STORAGE_KEYS.shared_context, true);
    storage.set(STORAGE_KEYS.shared_property_id, params.id);

    const t = setTimeout(() => {
      router.replace(`/property/${params.id}`);
    }, 200);
    return () => clearTimeout(t);
  }, [params, router]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="font-display text-[32px] font-semibold leading-none tracking-tight">
          ROI<span className="text-money">.</span>
        </div>
        <Loader2 className="w-4 h-4 text-ink-tertiary animate-spin" strokeWidth={2.5} />
        <div className="text-[11px] text-ink-tertiary uppercase tracking-wider font-medium">
          Opening shared property
        </div>
      </motion.div>
    </div>
  );
}
