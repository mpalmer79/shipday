import type { RiskState } from "@/lib/simulator";

/**
 * The mission alert bar. It takes over the top of the interface as risk climbs:
 * a tactical strip at the mid (raised) threshold, and a full red-alert banner at
 * the high threshold with an alarm rail sweeping across it. It stands down on
 * its own when risk recedes, because it renders straight off the live risk
 * state. Nothing here is the only signal: the words carry the meaning, the
 * colour and the rail reinforce.
 *
 * Contrast holds in every state: the red banner uses light ink on the solid
 * alert colour (8.58:1), and the tactical strip uses classified amber on the
 * dark surface (well above AA). role="status" announces the state change to
 * assistive tech.
 */
export function AlertBar({ riskState }: { riskState: RiskState }) {
  if (riskState === "calm") {
    return null;
  }

  if (riskState === "raised") {
    return (
      <div
        role="status"
        className="relative z-30 flex items-center justify-center gap-3 border-y border-classified/40 bg-classified/10 px-4 py-1.5 text-center"
      >
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-classified" />
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-classified">
          Condition amber · risk elevated · holding tactical
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="relative z-30 overflow-hidden border-y border-alert-bright/50 bg-alert-banner px-4 py-2 text-center"
    >
      <span
        aria-hidden="true"
        className="alarm-rail absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-alert-bright/40 to-transparent"
      />
      <span className="relative flex items-center justify-center gap-3">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 rounded-full bg-alert-bright shadow-[0_0_10px_rgb(var(--alert-bright))]"
        />
        <span className="font-mono text-xs font-bold uppercase tracking-[0.28em] text-ink">
          Red alert · risk critical · stand down when clear
        </span>
      </span>
    </div>
  );
}
