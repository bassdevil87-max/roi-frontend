"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Bookmark, Share2 } from "lucide-react";
import { AppHeader, HeaderIconButton } from "@/components/ui/AppHeader";
import { StatusBar } from "@/components/ui/StatusBar";
import { formatPriceFull } from "@/lib/utils";

interface PropertyHeroProps {
  image: string;
  address: string;
  subtitle: string;
  price: number;
  onEditPrice?: () => void;
}

export function PropertyHero({
  image,
  address,
  subtitle,
  price,
  onEditPrice,
}: PropertyHeroProps) {
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
              <HeaderIconButton
                icon={<Share2 className="w-4 h-4" strokeWidth={2} />}
                variant="transparent"
                ariaLabel="Share"
              />
              <HeaderIconButton
                icon={<Bookmark className="w-4 h-4" strokeWidth={2} />}
                variant="transparent"
                ariaLabel="Save"
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
