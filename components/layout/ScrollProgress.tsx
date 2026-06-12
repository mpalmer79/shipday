"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * A thin scroll-progress line at the top of the page. Transform only (scaleX),
 * updated on a passive scroll listener through requestAnimationFrame, so it
 * never thrashes layout. Decorative and aria-hidden; under reduced motion it
 * does not render at all.
 */
export function ScrollProgress() {
  const reducedMotion = useReducedMotion();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = barRef.current;
      if (!el) {
        return;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      el.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
    >
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0 bg-accent shadow-glow-sm"
      />
    </div>
  );
}
