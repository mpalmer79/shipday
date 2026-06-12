"use client";

import { forwardRef } from "react";

/**
 * The one obvious control that ends a cinematic sequence. Every set piece (the
 * cold open, the briefing, the resolution) renders one of these. It is a real
 * button, keyboard reachable, with a visible focus ring from the global focus
 * rule. The label says what it does.
 */
export const SkipButton = forwardRef<
  HTMLButtonElement,
  {
    onSkip: () => void;
    label?: string;
    className?: string;
  }
>(function SkipButton({ onSkip, label = "Skip", className = "" }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onSkip}
      className={`rounded-md border border-edge/60 bg-void/70 px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.18em] text-ink-muted transition-colors hover:border-accent hover:text-ink ${className}`}
    >
      {label}
    </button>
  );
});
