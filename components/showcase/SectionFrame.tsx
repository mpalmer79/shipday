import type { ReactNode } from "react";

/**
 * A landing section with an eyebrow, a headline, and optional standfirst. Wraps
 * its content in a labelled landmark so the page has a clean heading and
 * landmark structure. Pure presentation.
 */
export function SectionFrame({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6"
    >
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {eyebrow}
      </p>
      <h2
        id={headingId}
        className="mt-3 text-display-sm font-bold tracking-tight text-ink"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      <div className="mt-10">{children}</div>
    </section>
  );
}
