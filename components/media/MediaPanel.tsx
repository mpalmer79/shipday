import type { ReactNode } from "react";
import { ImageFrame, type ImageFrameVariant } from "./ImageFrame";

/**
 * A captioned section visual: an ImageFrame with an optional mono caption strip
 * laid over the lower edge. The caption gives meaningful images a visible
 * label without a layout-shifting block beneath them. Pure presentation; all
 * the fallback behaviour lives in ImageFrame.
 */
export function MediaPanel({
  src,
  alt,
  caption,
  aspect = "16/9",
  variant = "panel",
  decorative = false,
  priority = false,
  showPlaceholder = true,
  placeholderLabel,
  className = "",
  badge,
}: {
  src: string;
  alt: string;
  caption?: ReactNode;
  aspect?: string;
  variant?: ImageFrameVariant;
  decorative?: boolean;
  priority?: boolean;
  showPlaceholder?: boolean;
  placeholderLabel?: string;
  className?: string;
  /** Optional short eyebrow shown top-left, e.g. a classification tag. */
  badge?: string;
}) {
  return (
    <ImageFrame
      src={src}
      alt={alt}
      aspect={aspect}
      variant={variant}
      decorative={decorative}
      priority={priority}
      showPlaceholder={showPlaceholder}
      placeholderLabel={placeholderLabel}
      className={className}
      overlay={
        <>
          {badge && (
            <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-sm border border-edge/50 bg-void/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-accent backdrop-blur-sm">
              {badge}
            </span>
          )}
          {caption && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-void/90 to-transparent p-3">
              <p className="font-mono text-[11px] leading-relaxed text-ink-muted">
                {caption}
              </p>
            </div>
          )}
        </>
      }
    />
  );
}
