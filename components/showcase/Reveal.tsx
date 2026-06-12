"use client";

import type { ReactNode } from "react";
import { useInView } from "@/lib/useInView";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Rises its children into place when they scroll into view, transform and
 * opacity only. Under reduced motion it renders the children at rest
 * immediately. The entrance is a single short transition inside the motion
 * budget. Decorative wrapper, so it adds no semantics.
 */
export function Reveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>();
  const shown = reducedMotion || inView;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(12px)",
        transition: reducedMotion
          ? undefined
          : "opacity var(--motion-slow) var(--ease-entrance), transform var(--motion-slow) var(--ease-entrance)",
        transitionDelay: reducedMotion ? undefined : `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}
