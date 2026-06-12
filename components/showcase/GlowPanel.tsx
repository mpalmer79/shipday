import type { ElementType, ReactNode } from "react";

/**
 * A raised panel that catches accent light at its edge, the core surface of the
 * showpiece. Pure presentation: depth and glow come from the composed panel
 * shadow tokens, tone selects the cool or hot light. No state, no logic.
 */
export function GlowPanel({
  children,
  tone = "cool",
  className = "",
  as,
}: {
  children: ReactNode;
  tone?: "cool" | "hot";
  className?: string;
  as?: ElementType;
}) {
  const Tag = as ?? "div";
  const shadow = tone === "hot" ? "shadow-panel-hot" : "shadow-panel";
  const ring = tone === "hot" ? "border-hot/25" : "border-edge/40";
  return (
    <Tag
      className={`relative rounded-xl border ${ring} bg-panel/80 ${shadow} ${className}`}
    >
      {children}
    </Tag>
  );
}
