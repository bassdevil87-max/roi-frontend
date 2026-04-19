"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

interface BackToTopButtonProps {
  /**
   * Vertical offset in px to clear sticky UI elements. Match the FeedbackWidget
   * offset when both are on-page. Defaults to 80 (sits above the feedback FAB).
   */
  bottomOffset?: number;
  /**
   * Scroll threshold in px before the button appears. Default: 600px.
   */
  threshold?: number;
}

export function BackToTopButton({
  bottomOffset = 80,
  threshold = 600,
}: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const handleScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf);
    };
  }, [threshold]);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleClick}
          className="fixed right-4 z-30 bg-white border border-paper-stroke text-ink w-11 h-11 rounded-full shadow-card flex items-center justify-center hover:bg-paper-soft transition-colors"
          style={{
            bottom: `calc(${bottomOffset}px + var(--safe-bottom, 0px))`,
          }}
          aria-label="Back to top"
        >
          <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
