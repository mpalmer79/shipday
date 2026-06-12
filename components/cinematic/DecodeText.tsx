"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>";

/**
 * A short decode effect: the text resolves out of scrambled glyphs once on
 * mount, like a classified line being deciphered, then settles and stops. It is
 * finite (never an ambient loop), runs only when `active`, and under reduced
 * motion it renders the final text immediately with no scramble. The resolved
 * text is always the accessible content; the scramble is decorative overlay
 * timing only, so a reader using assistive tech gets the real string at once.
 */
export function DecodeText({
  text,
  active = true,
  className = "",
  durationMs = 560,
}: {
  text: string;
  active?: boolean;
  className?: string;
  durationMs?: number;
}) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(text);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (reducedMotion || !active) {
      setDisplay(text);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const settled = Math.floor(progress * text.length);
      let out = "";
      for (let i = 0; i < text.length; i += 1) {
        if (i < settled || text[i] === " ") {
          out += text[i];
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setDisplay(out);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [text, active, reducedMotion, durationMs]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
