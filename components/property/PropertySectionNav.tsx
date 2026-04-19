"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SectionDef {
  id: string;
  label: string;
  show?: boolean;          // Conditional sections (Section 8, tenant, etc.)
}

interface PropertySectionNavProps {
  sections: SectionDef[];
}

/**
 * Sticky horizontal nav that appears below the hero on the property page.
 * Tap a section to jump, auto-highlights as user scrolls.
 */
export function PropertySectionNav({ sections }: PropertySectionNavProps) {
  const visible = sections.filter((s) => s.show !== false);
  const [activeId, setActiveId] = useState<string | null>(visible[0]?.id ?? null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Observe which section is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    visible.forEach((section) => {
      const el = document.getElementById(section.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(section.id);
          }
        },
        {
          // Trigger when section top crosses the 25% viewport mark
          rootMargin: "-20% 0px -70% 0px",
          threshold: 0,
        }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [visible]);

  // When active changes, auto-scroll the nav to keep it visible
  useEffect(() => {
    if (!activeId || !scrollRef.current) return;
    const btn = scrollRef.current.querySelector<HTMLButtonElement>(
      `[data-section-id="${activeId}"]`
    );
    if (!btn) return;
    const parent = scrollRef.current;
    const btnRect = btn.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    if (btnRect.left < parentRect.left || btnRect.right > parentRect.right) {
      parent.scrollTo({
        left: btn.offsetLeft - parent.offsetWidth / 2 + btn.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Offset for the sticky nav height + some breathing room
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="sticky top-0 z-30 bg-paper-soft/95 backdrop-blur-md border-b border-paper-stroke">
      <div
        ref={scrollRef}
        className="no-scrollbar overflow-x-auto flex gap-1 px-5 py-2"
      >
        {visible.map((section) => {
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              data-section-id={section.id}
              onClick={() => handleClick(section.id)}
              className={cn(
                "relative flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap",
                isActive
                  ? "text-white"
                  : "text-ink-secondary hover:text-ink"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="section-pill-bg"
                  className="absolute inset-0 bg-ink rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{section.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
