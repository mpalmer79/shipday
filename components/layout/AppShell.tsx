import { Header } from "./Header";
import { Footer } from "./Footer";
import { AlertBar } from "@/components/cinematic/AlertBar";
import type { RiskState } from "@/lib/simulator";

/**
 * The app shell carries the global risk treatment. When a risk state is
 * passed, it lands as a data-risk attribute on the outermost element, and the
 * token layer in globals.css shifts the whole palette (surfaces, accent, clock
 * typography) for everything inside. A second attribute, data-alert, drives the
 * cinematic alert takeover: a tactical vignette at the mid threshold and the
 * red-alert vignette and alarm at the high threshold. Both stand down on their
 * own when risk recedes, because they render straight off the live state. Pages
 * with no live risk state simply omit it and render calm.
 *
 * The alert overlay never recolours body text or surfaces, so contrast holds
 * through the most intense state (light ink on the lifted alert high surface
 * stays at ~13.7:1). The overlay is fixed, pointer-transparent, and aria-hidden.
 *
 * The footer is opt-in so the framing pages can carry it while the focused
 * simulator gameplay view stays uncluttered.
 */
function alertLevel(riskState?: RiskState): "mid" | "high" | undefined {
  if (riskState === "high") {
    return "high";
  }
  if (riskState === "raised") {
    return "mid";
  }
  return undefined;
}

export function AppShell({
  children,
  riskState,
  footer = false,
}: {
  children: React.ReactNode;
  riskState?: RiskState;
  footer?: boolean;
}) {
  return (
    <div
      data-risk={riskState}
      data-alert={alertLevel(riskState)}
      className="relative flex min-h-screen flex-col bg-surface"
    >
      {/* The ambient high-risk glow sits behind all content and animates only
          when data-risk is high; reduced motion removes it entirely. */}
      <div
        aria-hidden="true"
        className="risk-ambient pointer-events-none absolute inset-0 z-0"
      />
      {/* The alert vignette: tactical at mid, red-alert breathing at high. Fixed
          so it covers the whole viewport, behind content, never interactive. */}
      <div
        aria-hidden="true"
        className="alert-overlay pointer-events-none fixed inset-0 z-0"
      />
      <div className="relative z-10 flex flex-1 flex-col">
        <Header />
        {riskState && <AlertBar riskState={riskState} />}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
        {footer && <Footer />}
      </div>
    </div>
  );
}
