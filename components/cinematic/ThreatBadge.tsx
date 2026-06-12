import type { ThreatLevel } from "@/lib/cinematic/dossier";

const TONE_TEXT: Record<ThreatLevel["tone"], string> = {
  signal: "text-signal",
  classified: "text-classified",
  alert: "text-alert",
  "alert-bright": "text-alert-bright",
};

const TONE_BAR: Record<ThreatLevel["tone"], string> = {
  signal: "bg-signal",
  classified: "bg-classified",
  alert: "bg-alert",
  "alert-bright": "bg-alert-bright",
};

/**
 * A four-segment threat meter with a tracked label. Pure presentation, driven
 * by the derived threat level. The numeric rank and label carry the meaning, so
 * the meter is decorative reinforcement, not the only signal.
 */
export function ThreatBadge({
  threat,
  className = "",
}: {
  threat: ThreatLevel;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${TONE_TEXT[threat.tone]}`}
      >
        Threat {threat.label}
      </span>
      <span aria-hidden="true" className="flex items-center gap-0.5">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={`h-2.5 w-1 rounded-sm ${
              n <= threat.rank ? TONE_BAR[threat.tone] : "bg-edge/50"
            }`}
          />
        ))}
      </span>
    </span>
  );
}
