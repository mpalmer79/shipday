"use client";

import { type ReactNode, useState } from "react";

/**
 * The foundational media primitive: a fixed-ratio container that renders a
 * local image, and falls back to a styled sci-fi placeholder whenever the
 * asset is missing or fails to load. Because every ShipDay image is a local
 * asset that may not be placed yet, the placeholder is the default state, not
 * an error state — the slot always reads as intentional, never broken.
 *
 * The container reserves its aspect ratio up front, so swapping a placeholder
 * for a real image (or vice versa) never shifts layout. Decorative images are
 * hidden from assistive tech; meaningful images carry their alt text. Below the
 * fold, callers pass `priority={false}` (the default) to lazy-load.
 */

export type ImageFrameVariant = "panel" | "bare";

const ASPECT: Record<string, string> = {
  "16/9": "aspect-[16/9]",
  "21/9": "aspect-[21/9]",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
};

function PlaceholderArt({ label }: { label?: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-panel/80"
    >
      {/* Faint engineering grid, matching the HUD surfaces. */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint bg-[size:22px_22px] opacity-40" />
      {/* A soft accent bloom so the slot still catches light. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgb(var(--accent)/0.12),transparent_60%)]" />
      {/* Corner brackets echo the mission HUD frame. */}
      <svg
        viewBox="0 0 60 60"
        className="relative h-10 w-10 text-accent/60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M6 22 V6 H22" />
        <path d="M38 6 H54 V22" />
        <path d="M54 38 V54 H38" />
        <path d="M22 54 H6 V38" />
        <circle cx="30" cy="30" r="7" strokeOpacity="0.7" />
        <path d="M30 12 V20 M30 40 V48 M12 30 H20 M40 30 H48" strokeOpacity="0.5" />
      </svg>
      <span className="relative mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
        {label ?? "Visual pending"}
      </span>
    </div>
  );
}

export function ImageFrame({
  src,
  alt,
  variant = "panel",
  aspect = "16/9",
  fill = false,
  decorative = false,
  priority = false,
  showPlaceholder = true,
  placeholderLabel,
  className = "",
  overlay,
}: {
  src: string;
  /** Required for meaningful images; ignored when `decorative`. */
  alt: string;
  variant?: ImageFrameVariant;
  /** Aspect ratio key; controls the reserved box so there is no layout shift. */
  aspect?: keyof typeof ASPECT | (string & {});
  /**
   * Fill the positioned parent (absolute inset-0) instead of reserving an
   * aspect-ratio box. For decorative background layers behind other content.
   */
  fill?: boolean;
  /** Decorative images are hidden from assistive tech (alt="" + aria-hidden). */
  decorative?: boolean;
  /** Above-the-fold images load eagerly; everything else lazy-loads. */
  priority?: boolean;
  /**
   * When true (default) a missing image shows the styled placeholder. When
   * false the frame stays transparent if the image is absent, for decorative
   * background layers that should simply disappear when art is not present.
   */
  showPlaceholder?: boolean;
  placeholderLabel?: string;
  className?: string;
  /** Optional content rendered above the image (scanlines, captions, etc.). */
  overlay?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  const ratioClass = ASPECT[aspect] ?? aspect;
  const frameClass =
    variant === "panel"
      ? "rounded-xl border border-edge/40 bg-panel/80 shadow-panel"
      : "rounded-lg";
  const layoutClass = fill ? "absolute inset-0" : ratioClass;

  return (
    <div
      className={`relative isolate overflow-hidden ${layoutClass} ${
        fill ? "" : frameClass
      } ${className}`}
    >
      {(!failed || !showPlaceholder) && (
        // Plain <img> (the app ships no next/image config and favours local,
        // unoptimized assets). object-cover fills the reserved ratio box.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={decorative ? "" : alt}
          aria-hidden={decorative || undefined}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {failed && showPlaceholder && (
        <PlaceholderArt label={placeholderLabel ?? (decorative ? undefined : alt)} />
      )}
      {/* A faint scanline sheen so even placeholders read as control-room glass. */}
      <div
        aria-hidden="true"
        className="scanlines pointer-events-none absolute inset-0 opacity-60"
      />
      {overlay}
    </div>
  );
}
