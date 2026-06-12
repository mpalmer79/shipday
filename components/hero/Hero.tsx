"use client";

import { type ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { HeroPoster } from "./HeroPoster";

// The 3D scene loads in its own chunk, only on the client, only after the
// static hero is already painted. The poster underneath is the LCP image, so
// first paint never waits on WebGL.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

/**
 * Feature and capability gate for the 3D enhancement: real WebGL, no save-data,
 * not a 2g link, and not a very low core count. The scene is an enhancement, so
 * any uncertainty falls back to the static poster.
 */
function canRender3D(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      return false;
    }
  } catch {
    return false;
  }
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) {
    return false;
  }
  if (nav.connection?.effectiveType && /(^|\b)(slow-)?2g\b/.test(nav.connection.effectiveType)) {
    return false;
  }
  if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 2) {
    return false;
  }
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) {
    return false;
  }
  return true;
}

/**
 * The hero region: a space-reserved band with the static poster as the base
 * layer (always present, the fallback and the LCP image), the optional 3D scene
 * composited over it, a scrim for text contrast, and the caller's hero content
 * on top. No layout shift: the band reserves its height and the poster fills it
 * before the scene initializes.
 */
export function Hero({ children }: { children?: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [enable3D, setEnable3D] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setEnable3D(false);
      return;
    }
    setEnable3D(canRender3D());
  }, [reducedMotion]);

  return (
    <section
      aria-label="ShipDay"
      className="relative flex min-h-[88vh] w-full items-center overflow-hidden bg-void"
    >
      <div className="absolute inset-0">
        {/* Static poster: the fallback and the LCP base. Server-rendered inline
            SVG, so it paints on first paint and the LCP never waits on WebGL. */}
        <div className="absolute inset-0 opacity-80">
          <HeroPoster />
        </div>
        {/* The 3D enhancement, composited over the poster. */}
        {enable3D && <HeroScene />}
        {/* Scrim: guarantees text contrast over any scene state. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-void via-void/85 to-void/40"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-void/90 to-transparent"
        />
      </div>
      <div className="relative mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
        {children}
      </div>
    </section>
  );
}
