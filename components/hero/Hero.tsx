"use client";

import { type ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ImageFrame } from "@/components/media";
import { homeMedia } from "@/lib/shipdayMedia";
import { HeroPoster } from "./HeroPoster";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

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

  if (
    nav.connection?.effectiveType &&
    /(^|\b)(slow-)?2g\b/.test(nav.connection.effectiveType)
  ) {
    return false;
  }

  if (
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 2
  ) {
    return false;
  }

  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) {
    return false;
  }

  return true;
}

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
        <ImageFrame
          src={homeMedia.hero}
          alt="ShipDay engineering command center showing mission dashboards, software delivery metrics, incident response panels, and a mission countdown."
          fill
          priority
          showPlaceholder
          className="opacity-100"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20 mix-blend-screen"
        >
          <HeroPoster />
        </div>

        {enable3D && (
          <div className="absolute inset-0 opacity-35">
            <HeroScene />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-void via-void/45 to-void/10"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-void/80 via-void/45 to-void/15"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_25%_45%,rgba(88,166,255,0.14),transparent_34%),radial-gradient(circle_at_78%_30%,rgba(245,158,11,0.08),transparent_28%)]"
        />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
        {children}
      </div>
    </section>
  );
}
