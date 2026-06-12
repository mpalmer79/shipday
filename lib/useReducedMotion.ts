"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the user's reduced-motion preference. Used to gate the cinematic
 * sequences off in component logic, so they never mount under the preference,
 * on top of the CSS contract in globals.css that neutralizes motion anyway.
 *
 * Defaults to false so server and first client render agree; the effect reads
 * the real preference after mount. The globals.css reduced-motion rule covers
 * the gap, so a reduced-motion user never sees motion even in that first frame.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
