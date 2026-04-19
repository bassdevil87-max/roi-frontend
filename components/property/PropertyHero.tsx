"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkCheck, Share2, Check, Copy } from "lucide-react";
import { AppHeader, HeaderIconButton } from "@/components/ui/AppHeader";
import { StatusBar } from "@/components/ui/StatusBar";
import { formatPriceFull, cn } from "@/lib/utils";
import { useSavedProperties } from "@/lib/useSavedProperties";

interface PropertyHeroProps {
  image: string;
  address: string;
  subtitle: string;
  price: number;
  propertyId: string;
  onEditPrice?: () => void;
}

type ShareState = "idle" | "copied" | "shared";

export function PropertyHero({
  image,
  address,
  subtitle,
  price,
  propertyId,
  onEditPrice,
}: PropertyHeroProps) {
  const [shareState, setShareState] = useState<ShareState>("idle");
  const { isSaved, toggle, isMounted } = useSavedProperties();
  const saved = isMounted && isSaved(propertyId);

  const handleShare = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/p/${propertyId}`
        : `/p/${propertyId}`;
    const shareData = {
      title: `ROI · ${address}`,
      text: `Take a look at this property on ROI: ${address}`,
      url: shareUrl,
    };

    // Try native Web Share first (mobile)
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        setShareState("shared");
        setTimeout(() => setShareState("idle"), 1600);
        return;
      } catch {
        // User cancelled or share API failed — fall through to clipboard
      }
    }

    // Fallback: copy the URL
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 1600);
        return;
      } catch {
        // Clipboard blocked — last-ditch prompt
      }
    }

    // Last resort — prompt dialog
    if (typeof window !== "undefined") {
      window.prompt("Copy this link:", shareUrl);
    }
  };

  return (
    <div className="relative">
      <StatusBar className="absolute top-0 left-0 right-0 z-20 text-white" />

      {/* Header — transparent, floats on top of hero image */}
      <div className="absolute top-11 left-0 right-0 z-20">
        <AppHeader
          title={address}
          subtitle={subtitle}
          variant="transparent"
          right={
            <div className="flex gap-1">
              <div className="relative">
                <HeaderIconButton
                  icon={
                    <AnimatePresence mode="wait">
                      {shareState === "idle" ? (
                        <motion.span
                          key="share"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Share2 className="w-4 h-4" strokeWidth={2} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="check"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <Check className="w-4 h-4 text-money" strokeWidth={2.5} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  }
                  variant="transparent"
                  ariaLabel="Share"
                  onClick={handleShare}
                />

                {/* Small toast below the share button */}
                <AnimatePresence>
                  {shareState !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-1 whitespace-nowrap bg-ink text-white text-[11px] font-semibold px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      <Copy className="w-2.5 h-2.5" strokeWidth={2.5} />
                      {shareState === "copied" ? "Link copied" : "Shared"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <HeaderIconButton
                icon={
                  saved ? (
                    <BookmarkCheck className="w-4 h-4 fill-current" strokeWidth={2} />
                  ) : (
                    <Bookmark className="w-4 h-4" strokeWidth={2} />
                  )
                }
                variant="transparent"
                ariaLabel={saved ? "Remove from saved" : "Save property"}
                onClick={() => toggle(propertyId)}
              />
            </div>
          }
        />
      </div>

      {/* Hero image */}
      <div className="relative w-full h-[320px] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={image}
            alt={address}
            fill
            sizes="(max-width: 430px) 100vw, 430px"
            priority
            className="object-cover"
          />
        </motion.div>

        {/* Gradient overlays for readability of text overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />
      </div>

      {/* Price bar — sits across the bottom of the image */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/70 mb-0.5 font-medium">
              Listing price
            </div>
            <div className="text-white font-display text-[28px] font-semibold leading-none tabular">
              {formatPriceFull(price)}
            </div>
          </div>
          <button
            onClick={onEditPrice}
            className="bg-white/95 backdrop-blur-md text-ink text-xs font-semibold px-3.5 py-2 rounded-full hover:bg-white transition-colors shadow-card"
          >
            Edit your offer price
          </button>
        </div>
      </div>
    </div>
  );
}
