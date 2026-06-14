import type { ReactNode } from "react";
import { ImageFrame } from "./ImageFrame";

/**
 * A polished empty state: a framed visual above a heading, supporting copy, and
 * an optional action. Used where a page has nothing to show yet (no runs to
 * compare) so the blank screen reads as intentional rather than missing. The
 * image is decorative; the heading carries the meaning.
 */
export function EmptyStateGraphic({
  src,
  alt,
  title,
  description,
  aspect = "21/9",
  children,
}: {
  src: string;
  alt: string;
  title: string;
  description?: ReactNode;
  aspect?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <ImageFrame
        src={src}
        alt={alt}
        aspect={aspect}
        decorative
        placeholderLabel="Standing by"
        className="w-full"
      />
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-ink">{title}</h1>
      {description && (
        <div className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
          {description}
        </div>
      )}
      {children}
    </div>
  );
}
