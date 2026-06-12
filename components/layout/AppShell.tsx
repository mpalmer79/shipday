import { Header } from "./Header";
import type { RiskState } from "@/lib/simulator";

/**
 * The app shell carries the global risk treatment. When a risk state is
 * passed, it lands as a data-risk attribute on the outermost element, and the
 * token layer in globals.css shifts the whole palette (surfaces, accent, clock
 * typography) for everything inside. Pages with no live risk state simply omit
 * it and render calm.
 */
export function AppShell({
  children,
  riskState,
}: {
  children: React.ReactNode;
  riskState?: RiskState;
}) {
  return (
    <div
      data-risk={riskState}
      className="flex min-h-screen flex-col bg-surface"
    >
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
