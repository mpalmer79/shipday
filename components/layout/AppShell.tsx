import { Header } from "./Header";
import { Footer } from "./Footer";
import type { RiskState } from "@/lib/simulator";

/**
 * The app shell carries the global risk treatment. When a risk state is
 * passed, it lands as a data-risk attribute on the outermost element, and the
 * token layer in globals.css shifts the whole palette (surfaces, accent, clock
 * typography) for everything inside. Pages with no live risk state simply omit
 * it and render calm.
 *
 * The footer is opt-in so the framing pages can carry it while the focused
 * simulator gameplay view stays uncluttered.
 */
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
      className="relative flex min-h-screen flex-col bg-surface"
    >
      {/* The ambient high-risk glow sits behind all content and animates only
          when data-risk is high; reduced motion removes it entirely. */}
      <div
        aria-hidden="true"
        className="risk-ambient pointer-events-none absolute inset-0 z-0"
      />
      <div className="relative z-10 flex flex-1 flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
        {footer && <Footer />}
      </div>
    </div>
  );
}
