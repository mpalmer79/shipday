"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { homeMedia } from "@/lib/shipdayMedia";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { HeroPoster } from "./HeroPoster";

// The WebGL scene is the heaviest thing on the page and purely decorative, so
// it is loaded only on the client, only after the cheaper layers have painted,
// and only when the device can carry it. Splitting it out keeps `three` off the
// critical path and out of the server bundle.
const HeroScene = dynamic(
  () => import("./HeroScene").then((m) => m.HeroScene),
  { ssr: false }
);

/**
 * Decide, once, whether this client should run the live WebGL scene. The static
 * image plus the SVG poster always carry the hero, so this gate only ever adds
 * motion on top — it never gates the meaning or the LCP.
 *
 * We decline on: no WebGL context, an explicit reduced-motion or save-data
 * preference, a slow effective connection, or a low core/memory device. The
 * checks are cheap and run after mount so server and first client paint agree.
 */
function useSceneCapable(reducedMotion: boolean): boolean {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setCapable(false);
      return;
    }

    // Save-data and slow links: skip the scene to respect the budget.
    const conn = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;

    // Low-end hardware heuristics.
    const cores = navigator.hardwareConcurrency ?? 8;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory ?? 8;
    if (cores <= 4 || memory <= 4) return;

    // Probe for an actual WebGL context before committing to the scene.
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return;
    } catch {
      return;
    }

    setCapable(true);
  }, [reducedMotion]);

  return capable;
}

/**
 * Drive the hero's own risk temperature on a slow, finite-feeling loop so a
 * visitor *sees* the room go tactical before reading a word about it. This sets
 * the same `data-risk` attribute the simulator uses, so the established palette
 * system (calm -> raised -> high, plus the clock-tracking widen) does all the
 * actual work — the hero just walks through the states the engine resolves at.
 *
 * Never runs under reduced motion; the hero then rests in calm. The cycle eases
 * up to red, holds briefly, then de-escalates all the way back, mirroring the
 * product's thesis that pulling out of trouble reads as clearly as falling in.
 */
function useRiskDrift(enabled: boolean): "calm" | "raised" | "high" {
  const [risk, setRisk] = useState<"calm" | "raised" | "high">("calm");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) {
      setRisk("calm");
      return;
    }

    // One authored cycle, in ms from the start of the loop. The long tail in
    // calm lets the hero breathe between escalations rather than strobing.
    const CYCLE: { at: number; to: "calm" | "raised" | "high" }[] = [
      { at: 3200, to: "raised" },
      { at: 6000, to: "high" },
      { at: 9000, to: "raised" },
      { at: 11000, to: "calm" },
    ];
    const PERIOD = 16000;

    let stopped = false;
    function run() {
      if (stopped) return;
      for (const step of CYCLE) {
        timers.current.push(
          window.setTimeout(() => setRisk(step.to), step.at)
        );
      }
      timers.current.push(window.setTimeout(run, PERIOD));
    }
    run();

    return () => {
      stopped = true;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
  }, [enabled]);

  return risk;
}

export function Hero({ children }: { children?: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const sceneCapable = useSceneCapable(reducedMotion);
  const risk = useRiskDrift(!reducedMotion);

  return (
    <section
      aria-label="ShipDay"
      data-risk={risk}
      className="relative flex min-h-[88vh] w-full items-center overflow-hidden bg-void"
    >
      <div className="absolute inset-0">
        {/* Layer 1 — the cinematic still. Largest Contentful Paint base; it
            paints immediately and carries the hero on every device, including
            no-JS and reduced-motion. */}
        <img
          src={homeMedia.hero}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[68%_center] md:object-center"
        />

        {/* Layer 2 — the structural SVG poster. Server-renderable geometry that
            gives the scene its converging grid, network, and core even before
            (or instead of) the WebGL layer. Blended over the photo so the two
            read as one volumetric room. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 mix-blend-screen"
        >
          <HeroPoster />
        </div>

        {/* Layer 3 — the live WebGL scene, mounted only when the client can
            carry it and motion is allowed. It warms cool->hot under the pointer
            and adds slow parallax; if it never mounts, layers 1-2 stand alone. */}
        {sceneCapable && <HeroScene />}

        {/* Cinematic grade: directional wash for legible copy, a floor-up
            gradient to seat the scene, accent blooms, and scanlines. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-void/90 via-void/58 to-void/18"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-void via-void/35 to-void/5"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_25%_45%,rgba(88,166,255,0.10),transparent_32%),radial-gradient(circle_at_78%_30%,rgba(245,158,11,0.08),transparent_28%)]"
        />
        <div
          aria-hidden="true"
          className="scanlines pointer-events-none absolute inset-0 opacity-35"
        />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
        {children}
      </div>
    </section>
  );
}
