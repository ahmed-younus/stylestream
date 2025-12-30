import { useState, useCallback } from "react";
import { PanInfo } from "framer-motion";

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export const useSwipeGesture = (options: UseSwipeGestureOptions = {}) => {
  const { 
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeUp, 
    onSwipeDown, 
    threshold = 50 
  } = options;

  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(null);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      
      // Check horizontal swipe
      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        if (offset.x < -threshold || velocity.x < -500) {
          onSwipeLeft?.();
        } else if (offset.x > threshold || velocity.x > 500) {
          onSwipeRight?.();
        }
      } else {
        // Check vertical swipe
        if (offset.y < -threshold || velocity.y < -500) {
          onSwipeUp?.();
        } else if (offset.y > threshold || velocity.y > 500) {
          onSwipeDown?.();
        }
      }
      
      setDragDirection(null);
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]
  );

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -20) {
        setDragDirection("left");
      } else if (info.offset.x > 20) {
        setDragDirection("right");
      } else {
        setDragDirection(null);
      }
    },
    []
  );

  return {
    dragDirection,
    gestureHandlers: {
      drag: "x" as const,
      dragConstraints: { left: 0, right: 0 },
      dragElastic: 0.2,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
    },
  };
};

export default useSwipeGesture;
