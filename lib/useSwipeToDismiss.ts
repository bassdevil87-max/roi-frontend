"use client";

import { useState } from "react";
import type { PanInfo } from "framer-motion";

/**
 * Swipe-down-to-dismiss behavior for bottom sheet modals.
 *
 * Usage with framer-motion:
 *
 *   const swipe = useSwipeToDismiss({ onDismiss: () => setOpen(false) });
 *   <motion.div drag="y" {...swipe.props} animate={{ y: swipe.dragY }}>
 *     ...
 *   </motion.div>
 */
export function useSwipeToDismiss({
  onDismiss,
  threshold = 100,
}: {
  onDismiss: () => void;
  threshold?: number;
}) {
  const [dragY, setDragY] = useState(0);

  const handleDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    // If user dragged down past threshold OR flicked down with velocity, dismiss
    if (info.offset.y > threshold || info.velocity.y > 500) {
      onDismiss();
    }
    setDragY(0);
  };

  const handleDrag = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    // Only track downward drag — upward resists
    setDragY(Math.max(0, info.offset.y));
  };

  return {
    dragY,
    props: {
      drag: "y" as const,
      dragDirectionLock: true,
      dragConstraints: { top: 0, bottom: 400 },
      dragElastic: { top: 0, bottom: 0.4 },
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
    },
  };
}
