import type { ThreatLevel } from "@/lib/cinematic/dossier";

const TONE_FILL: Record<ThreatLevel["tone"], string> = {
  signal: "bg-signal",
  classified: "bg-classified",
  alert: "bg-alert",
  "alert-bright": "bg-alert-bright",
};

const TONE_TEXT: Record<ThreatLevel["tone"], string> = {
  signal: "text-signal",
  classified: "text-classified",
  alert: "text-alert",
  "alert-bright": "text-alert-bright",
};

/**
 * A slim continuous threat bar derived from a mission's threat level. Sits
 * inside a dossier card; the bar width reads the four-step rank, and on hover
 * or focus of the parent `group` it gives a single gentle pulse so the card
 * feels live without distracting. The pulse is opacity-only and neutralized
 * under reduced motion by the global contract. The label carries the meaning,
 * so the bar is reinforcement, not the only signal.
 */
export function ThreatIndicator({
  threat,
  className = "",
}: {
  threat: ThreatLevel;
  className?: string;
}) {
  const pct = (threat.rank / 4) * 100;
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${TONE_TEXT[threat.tone]}`}
        >
          Threat {threat.label}
        </span>
        <span className="font-mono text-[10px] text-ink-faint">
          {threat.rank}/4
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-void">
        <div
          className={`h-full rounded-full ${TONE_FILL[threat.tone]} transition-[width] duration-300 group-hover:animate-pulse group-focus-visible:animate-pulse`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
