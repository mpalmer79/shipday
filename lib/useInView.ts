"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when an element scrolls into view. Used to start the living
 * sections only when they are seen, so nothing animates offscreen. The
 * observer disconnects after the first intersection, so it costs nothing after
 * it fires. SSR-safe: returns false until mounted.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  rootMargin = "0px 0px -15% 0px"
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView];
}
