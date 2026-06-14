import type { ReactNode } from "react";
import Link from "next/link";
import { AgencyBadge, FooterLinkIcon, type FooterIconName } from "@/components/media";

/**
 * The shared site footer. Four columns on desktop (brand, about, features,
 * quick links), two on tablet, one on mobile. On mobile the whole footer
 * centers to match the site's mobile-centering convention; from the md
 * breakpoint up it aligns left. Every colour maps to a design token so the
 * footer inherits the operations-room palette and shifts with it. Pure
 * presentation: the only dynamic value is the copyright year, evaluated on
 * the server at build time so the component stays static-export safe.
 */

const LINKEDIN_URL = "https://www.linkedin.com/in/mpalmer1234";
const GITHUB_URL = "https://github.com/mpalmer79/shipday";

// Primary in-app navigation, each pointing at the real app route and paired
// with an inline icon. These are the operative's quick links into the product.
const NAV_LINKS: { label: string; href: string; icon: FooterIconName }[] = [
  { label: "Missions", href: "/scenarios", icon: "missions" },
  { label: "Studio", href: "/studio", icon: "studio" },
  { label: "Import", href: "/import", icon: "import" },
  { label: "Compare", href: "/compare", icon: "compare" },
];

// Project links resolve only to real destinations on the repository's own
// GitHub surfaces. See docs/DECISIONS.md for the mapping.
const PROJECT_LINKS: { label: string; href: string }[] = [
  { label: "Documentation", href: `${GITHUB_URL}#readme` },
  { label: "Changelog", href: `${GITHUB_URL}/commits/main` },
  { label: "Report an Issue", href: `${GITHUB_URL}/issues` },
];

const MONO_TOKENS = ["realistic", "engineering", "simulator"];

const ABOUT_PARAGRAPHS = [
  "ShipDay is a realistic software engineering simulator that puts you in the seat of a developer.",
  "Make decisions. Manage trade-offs. Handle real-world challenges. See the impact of your choices.",
  "Build your career. Leave your mark.",
];

// Six capabilities, each with a decorative inline icon. The icons are
// aria-hidden; the label is the accessible name.
const FEATURES: { label: string; icon: ReactNode }[] = [
  {
    label: "Career Progression",
    icon: (
      <>
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="15 7 21 7 21 13" />
      </>
    ),
  },
  {
    label: "Real Engineering Decisions",
    icon: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="9" r="2.5" />
        <path d="M6 8.5v7" />
        <path d="M6 11h6a3 3 0 0 0 3-2.5" />
      </>
    ),
  },
  {
    label: "Incidents and Outages",
    icon: (
      <>
        <path d="M12 3 2 20h20L12 3z" />
        <line x1="12" y1="10" x2="12" y2="14" />
        <line x1="12" y1="17" x2="12" y2="17" />
      </>
    ),
  },
  {
    label: "Metrics That Matter",
    icon: (
      <>
        <line x1="6" y1="20" x2="6" y2="12" />
        <line x1="12" y1="20" x2="12" y2="5" />
        <line x1="18" y1="20" x2="18" y2="14" />
      </>
    ),
  },
  {
    label: "Work-Life Balance",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 16 14" />
      </>
    ),
  },
  {
    label: "Technical Depth",
    icon: (
      <>
        <polyline points="9 8 5 12 9 16" />
        <polyline points="15 8 19 12 15 16" />
      </>
    ),
  },
];

function FeatureIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-accent"
    >
      {children}
    </svg>
  );
}

function ColumnHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-mono text-xs uppercase tracking-widest text-ink-faint">
      {children}
    </h2>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      aria-labelledby="footer-brand"
      className="border-t border-edge/30 bg-void"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-2 md:text-left lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:pr-4">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <AgencyBadge className="h-11 w-11" />
              <p
                id="footer-brand"
                className="flex items-center gap-2"
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-lg font-bold text-accent"
                >
                  {">_"}
                </span>
                <span className="text-xl font-semibold tracking-tight text-ink">
                  <span className="text-accent">Ship</span>Day
                </span>
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              A day in the life of a software engineer. Every decision. Every
              trade-off. Every day.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 font-mono text-xs text-ink-faint md:justify-start">
              {MONO_TOKENS.map((token) => (
                <span key={token}>{`< ${token} >`}</span>
              ))}
            </div>
          </div>

          {/* About column */}
          <div>
            <ColumnHeading>About</ColumnHeading>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
              {ABOUT_PARAGRAPHS.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Simulator Features column */}
          <div>
            <ColumnHeading>Simulator Features</ColumnHeading>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-muted">
              {FEATURES.map((feature) => (
                <li
                  key={feature.label}
                  className="flex items-center justify-center gap-2.5 md:justify-start"
                >
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links column */}
          <nav aria-label="Footer quick links">
            <ColumnHeading>Quick Links</ColumnHeading>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-center gap-2.5 rounded text-ink-muted transition-colors hover:text-ink md:justify-start"
                  >
                    <span className="text-accent">
                      <FooterLinkIcon name={link.icon} />
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <ColumnHeading>
              <span className="mt-6 block">Project</span>
            </ColumnHeading>
            <ul className="mt-4 space-y-2.5 text-sm">
              {PROJECT_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded text-ink-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-6 border-t border-surface-line pt-8">
          <p className="text-center font-mono text-sm text-accent">
            Ship smart. Ship value. ShipDay.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-xs text-ink-faint">
              {`© ${year} ShipDay. All rights reserved.`}
            </p>
            <ul className="flex items-center gap-3">
              <li>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="ShipDay creator on LinkedIn (opens in a new tab)"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-line text-ink-muted transition-colors hover:border-accent hover:text-ink"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="ShipDay on GitHub (opens in a new tab)"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-line text-ink-muted transition-colors hover:border-accent hover:text-ink"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58l-.01-2.05c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
          <p className="text-center text-sm italic text-ink-muted">
            {"“It is not about writing code. It is about shipping value.”"}
          </p>
        </div>
      </div>
    </footer>
  );
}
