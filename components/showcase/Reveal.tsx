"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Rises its children into place when they scroll into view, transform and
 * opacity only. The entrance is an enhancement: the content renders visible by
 * default (the "idle" state), so it is fully legible without JavaScript and
 * never hides if the observer cannot run. Only after mount, and only for
 * content still below the fold, does it hide and then reveal, so nothing
 * already on screen flashes. Under reduced motion it shows immediately.
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
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    if (reducedMotion) {
      setState("shown");
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setState("shown");
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setState("shown");
      return;
    }
    setState("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("shown");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  let style: CSSProperties = {};
  if (state === "hidden") {
    style = { opacity: 0, transform: "translateY(12px)" };
  } else if (state === "shown") {
    style = {
      opacity: 1,
      transform: "none",
      transition: reducedMotion
        ? undefined
        : "opacity var(--motion-slow) var(--ease-entrance), transform var(--motion-slow) var(--ease-entrance)",
      transitionDelay: reducedMotion ? undefined : `${delayMs}ms`,
    };
  }

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
