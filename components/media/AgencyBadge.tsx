"use client";

import { useState } from "react";
import { brandMedia } from "@/lib/shipdayMedia";

/**
 * The ShipDay agency badge for the footer brand block. Loads the local badge
 * raster; if it is not placed yet, it falls back to an inline emblem so the
 * brand mark is always present and never shows a broken image. Decorative — the
 * footer's brand heading carries the accessible name.
 */
export function AgencyBadge({ className = "h-12 w-12" }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className={className}
        fill="none"
      >
        <path
          d="M24 3 41 9v12c0 11-7.5 18.5-17 24C14.5 39.5 7 32 7 21V9l17-6Z"
          className="text-accent"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="rgb(var(--panel) / 0.8)"
        />
        <text
          x="24"
          y="27"
          textAnchor="middle"
          className="fill-accent font-mono"
          fontSize="13"
          fontWeight="700"
        >
          {">_"}
        </text>
        <path
          d="M16 32h16"
          className="text-edge"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandMedia.agencyBadge}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
    />
  );
}
