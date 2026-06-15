"use client";

import { type ReactNode } from "react";
import { homeMedia } from "@/lib/shipdayMedia";

export function Hero({ children }: { children?: ReactNode }) {
  return (
    <section
      aria-label="ShipDay"
      className="relative flex min-h-[88vh] w-full items-center overflow-hidden bg-void"
    >
      <div className="absolute inset-0">
        <img
          src={homeMedia.hero}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[68%_center] md:object-center"
        />

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
