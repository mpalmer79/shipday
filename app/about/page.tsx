import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ClassifiedStamp } from "@/components/cinematic";
import { socialMetadata } from "@/lib/site";

const PAGE_TITLE = "About Michael Palmer";
const PAGE_DESCRIPTION =
  "Learn more about Michael Palmer, the developer of ShipDay.";

// The developer's verified public profiles. External, opened in a new tab with
// a safe rel. No other contact details are invented or implied.
const GITHUB_URL = "https://www.github.com/mpalmer79";
const LINKEDIN_URL = "https://www.linkedin.com/in/mpalmer1234";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  ...socialMetadata({
    title: `${PAGE_TITLE} · ShipDay`,
    description: PAGE_DESCRIPTION,
    path: "/about",
  }),
};

// What the project sets out to demonstrate. Kept factual and grounded in the
// codebase — no credentials or claims beyond what ShipDay itself shows.
const DEMONSTRATES = [
  {
    title: "Deterministic simulation logic",
    body: "A pure, framework-agnostic engine: the same scenario and the same decisions always produce the same metrics, flags, and outcome.",
  },
  {
    title: "Software delivery judgment",
    body: "Scenarios model the real calls of shipping under pressure — investigate before acting, test before rushing, communicate when holding.",
  },
  {
    title: "Risk management",
    body: "Six tracked metrics and clear risk thresholds drive both the outcome and a cohesive escalation in the interface.",
  },
  {
    title: "Technical design",
    body: "Next.js, React, TypeScript, and Three.js, with a clean separation between the tested domain engine and the UI.",
  },
  {
    title: "Polished product presentation",
    body: "A cohesive dark, agency-operations design system with cinematic motion, real accessibility, and no backend at all.",
  },
];

export default function AboutPage() {
  return (
    <AppShell footer>
      <div className="relative mx-auto max-w-3xl py-10">
        {/* A faint engineering grid behind the header, matching the briefing
            surfaces elsewhere in the app. Decorative and non-interactive. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-6 bottom-0 -z-10 bg-grid-faint bg-[size:34px_34px] opacity-[0.15] [mask-image:radial-gradient(110%_70%_at_50%_0%,black,transparent)]"
        />

        <div className="flex flex-col gap-4">
          <ClassifiedStamp label="About the developer" className="self-start" />
          <h1 className="text-display-sm font-bold tracking-tight text-ink text-center md:text-left">
            About the Developer
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-ink-muted text-center md:text-left">
            Michael Palmer built ShipDay as a deterministic software engineering
            simulator focused on delivery judgment, risk, quality, and technical
            decision-making.
          </p>
        </div>

        {/* Developer */}
        <section className="mt-10">
          <h2 className="text-xs font-mono uppercase tracking-wide text-ink-faint">
            Developer
          </h2>
          <div className="mt-3 rounded-2xl border border-surface-line bg-surface-raised/60 p-5 shadow-panel">
            <p className="text-sm leading-relaxed text-ink-muted">
              <span className="font-semibold text-ink">Michael Palmer</span> is
              the developer of ShipDay — a real-life software engineering
              simulator about shipping safely under pressure. ShipDay runs
              entirely in the browser with no backend, no database, and no API
              calls, which keeps every run deterministic and shareable by link
              alone.
            </p>
          </div>
        </section>

        {/* What ShipDay Demonstrates */}
        <section className="mt-10">
          <h2 className="text-xs font-mono uppercase tracking-wide text-ink-faint">
            What ShipDay Demonstrates
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DEMONSTRATES.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-surface-line bg-surface-raised/40 p-4"
              >
                <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Connect */}
        <section className="mt-10">
          <h2 className="text-xs font-mono uppercase tracking-wide text-ink-faint">
            Connect
          </h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-edge bg-surface-raised px-4 py-3 text-ink shadow-glow-sm transition-colors hover:bg-surface-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-line bg-surface font-mono text-sm font-bold text-accent"
                >
                  GH
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">GitHub</span>
                  <span className="font-mono text-xs text-ink-faint">
                    @mpalmer79
                  </span>
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-ink-faint transition-colors group-hover:text-accent"
              >
                ↗
              </span>
            </a>

            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-edge bg-surface-raised px-4 py-3 text-ink shadow-glow-sm transition-colors hover:bg-surface-overlay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-line bg-surface font-mono text-sm font-bold text-accent"
                >
                  in
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">LinkedIn</span>
                  <span className="font-mono text-xs text-ink-faint">
                    in/mpalmer1234
                  </span>
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-ink-faint transition-colors group-hover:text-accent"
              >
                ↗
              </span>
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
