/**
 * Local knowledge base for the ShipDay Project Assistant.
 *
 * Every fact the assistant can state lives here. There is no network call, no
 * model, no database, and no environment variable behind any of this: the
 * assistant answers strictly from these typed entries, in the browser. If a
 * fact is not written here, the assistant does not know it and says so.
 *
 * Entries are intentionally written in plain, recruiter-friendly prose so the
 * assistant reads like a knowledgeable project guide rather than a spec dump.
 */

/** The broad subject a knowledge entry belongs to. Surfaced in the UI as the
 * matched category label beside an answer. */
export type KnowledgeCategory =
  | "Overview"
  | "Simulator"
  | "Determinism"
  | "Scenarios"
  | "Metrics"
  | "Risk"
  | "Runs"
  | "Studio"
  | "Technical Design"
  | "Accessibility"
  | "Recruiter Summary";

/** A single, self-contained piece of project knowledge. */
export type KnowledgeEntry = {
  /** Stable identifier, also used for related-question lookups. */
  id: string;
  /** Short human title, shown as a heading is not required but useful. */
  title: string;
  /** The broad subject, surfaced as the matched category in the UI. */
  category: KnowledgeCategory;
  /** Canonical phrasings a user might type. Exact-ish matches score highest. */
  questions: string[];
  /** Distinctive terms that point at this entry. Drives keyword + typo scoring. */
  keywords: string[];
  /** The deterministic answer. Plain prose, no live data. */
  answer: string;
  /** Optional in-app links that help the reader go deeper. Local routes only. */
  relatedLinks?: { label: string; href: string }[];
  /** Optional follow-up questions, offered as buttons after the answer. */
  relatedQuestions?: string[];
};

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: "overview",
    title: "What ShipDay is",
    category: "Overview",
    questions: [
      "What is ShipDay?",
      "What is this project?",
      "Tell me about ShipDay",
      "What does ShipDay do?",
      "Explain ShipDay",
    ],
    keywords: [
      "shipday",
      "what",
      "about",
      "overview",
      "project",
      "simulator",
      "purpose",
      "intro",
      "introduction",
    ],
    answer:
      "ShipDay is a real-life software engineering simulator about shipping safely under pressure. You step into an engineer's workday, face realistic incidents — a broken build, a risky Friday deploy, a missing requirement — and make the same judgment calls a working engineer makes: investigate or act, test or rush, ship or hold. Every choice moves a set of metrics and steers the day toward one of several end-of-day outcomes. It runs entirely in the browser with no backend, no database, no API calls, and no environment variables.",
    relatedLinks: [
      { label: "Browse missions", href: "/scenarios" },
      { label: "Open the Studio", href: "/studio" },
    ],
    relatedQuestions: [
      "How does the simulator work?",
      "What are the built-in scenarios?",
      "What does this project demonstrate technically?",
    ],
  },
  {
    id: "simulator",
    title: "How the simulator works",
    category: "Simulator",
    questions: [
      "How does the simulator work?",
      "How does the simulator engine work?",
      "How do scenarios play out?",
      "How do decisions affect the outcome?",
      "What happens when I make a choice?",
    ],
    keywords: [
      "simulator",
      "engine",
      "work",
      "works",
      "mechanics",
      "decision",
      "decisions",
      "choice",
      "choices",
      "step",
      "steps",
      "option",
      "options",
      "outcome",
      "outcomes",
      "flag",
      "flags",
      "play",
      "how",
    ],
    answer:
      "Each scenario is a series of steps. A step presents a situation and a few options; choosing one applies fixed impacts to your metrics, can set narrative flags, and points to the next step. When the day ends, a pure outcome resolver reads your final metrics and flags against the scenario's ordered rules and picks the outcome whose rule matches at the highest priority — or a documented fallback if none match. The engine is a plain function: the same scenario and the same choices always produce the same metrics, flags, and outcome.",
    relatedLinks: [
      { label: "Play a mission", href: "/scenarios" },
    ],
    relatedQuestions: [
      "Why is it deterministic?",
      "What metrics does it track?",
      "What happens if risk gets high?",
    ],
  },
  {
    id: "determinism",
    title: "Determinism, no backend, no API calls",
    category: "Determinism",
    questions: [
      "Why is it deterministic?",
      "Is it deterministic?",
      "Does it use an API?",
      "Does it call a server or backend?",
      "Does it use a database?",
      "Are there any external calls?",
      "Does it make network calls?",
    ],
    keywords: [
      "deterministic",
      "determinism",
      "repeatable",
      "reproducible",
      "same",
      "result",
      "api",
      "backend",
      "server",
      "database",
      "network",
      "fetch",
      "call",
      "calls",
      "external",
      "environment",
      "offline",
      "browser",
    ],
    answer:
      "ShipDay is deterministic and browser-only by design. The simulator engine is a pure function with no randomness: the same scenario and the same decisions always yield the same metrics, flags, and outcome, so a run is fully repeatable and reproducible. There is no backend, no database, no API call, no model, and no environment variable anywhere in the experience. Everything — the engine, the scenarios, replay, reports, and comparison — runs locally in your browser, which is exactly what makes runs shareable by link without a server.",
    relatedLinks: [
      { label: "See a comparison", href: "/compare" },
    ],
    relatedQuestions: [
      "How does the simulator work?",
      "What technology is it built with?",
      "Can I share or compare runs?",
    ],
  },
  {
    id: "scenarios",
    title: "The five built-in scenarios",
    category: "Scenarios",
    questions: [
      "What are the built-in scenarios?",
      "What scenarios are there?",
      "What missions can I play?",
      "How many scenarios are there?",
      "What are the dossiers?",
    ],
    keywords: [
      "scenario",
      "scenarios",
      "mission",
      "missions",
      "dossier",
      "dossiers",
      "built-in",
      "builtin",
      "five",
      "list",
      "play",
      "difficulty",
    ],
    answer:
      "ShipDay ships with five built-in scenarios, ramping in difficulty: 'Just Add a Button' (starter) — a one-line ticket that turns into a day of judgment calls; 'The Broken Build' (intermediate) — main is red, the release is at 3:00 PM, and the suspect is out sick; 'The Missing Requirement' (intermediate) — work approved and ready to merge until a stakeholder mentions a constraint nobody wrote down; 'Friday Deploy' (advanced) — a two-line config change, a 5:00 PM window, and half the team gone; and 'The Page' (expert) — a production page lands while your feature branch is half done.",
    relatedLinks: [
      { label: "Browse all missions", href: "/scenarios" },
    ],
    relatedQuestions: [
      "How does the simulator work?",
      "Can I build my own scenario?",
      "What metrics does it track?",
    ],
  },
  {
    id: "metrics",
    title: "Metrics: quality, speed, risk, trust, focus, test confidence",
    category: "Metrics",
    questions: [
      "What metrics does it track?",
      "What are the metrics?",
      "What is test confidence?",
      "What does quality or trust mean?",
      "How are metrics measured?",
    ],
    keywords: [
      "metric",
      "metrics",
      "quality",
      "speed",
      "risk",
      "trust",
      "focus",
      "confidence",
      "test",
      "testconfidence",
      "measure",
      "score",
      "stat",
      "stats",
    ],
    answer:
      "Every run tracks six metrics: Code Quality, Delivery Speed, Risk, Stakeholder Trust, Focus, and Test Confidence. Each starts at a scenario-defined value and shifts by fixed amounts as you choose options — investigating carefully might lift quality and lower risk, while rushing might gain speed at the cost of test confidence and trust. Risk is the one to watch: it drives the room's alert state and weighs heavily in which end-of-day outcome you reach.",
    relatedLinks: [
      { label: "Play a mission", href: "/scenarios" },
    ],
    relatedQuestions: [
      "What happens if risk gets high?",
      "How does the simulator work?",
      "Why is it deterministic?",
    ],
  },
  {
    id: "risk",
    title: "Risk thresholds and alert states",
    category: "Risk",
    questions: [
      "What happens if risk gets high?",
      "What are the risk thresholds?",
      "What is the red alert?",
      "What do the alert states mean?",
      "When does the room go red?",
    ],
    keywords: [
      "risk",
      "alert",
      "red",
      "amber",
      "green",
      "raised",
      "high",
      "calm",
      "threshold",
      "thresholds",
      "danger",
      "warning",
      "state",
      "states",
      "escalate",
    ],
    answer:
      "Risk has three states, and the whole interface responds to them. Below 40, the day is calm. Crossing 40 it reads as raised — the accent warms toward amber and the mission clock tightens. Crossing 65 it reads as high: the room turns red with an alert vignette and a slow alarm breath. These same two thresholds, 40 and 65, are the single source of truth — the outcome resolver and the visual treatment read the same numbers, so what you see can never disagree with how the run actually resolves.",
    relatedLinks: [
      { label: "Play a mission", href: "/scenarios" },
    ],
    relatedQuestions: [
      "What metrics does it track?",
      "How does the simulator work?",
      "Can I replay a run to see my decisions?",
    ],
  },
  {
    id: "runs",
    title: "Replay, report, comparison, and shareable runs",
    category: "Runs",
    questions: [
      "Can I replay a run?",
      "Can I compare two runs?",
      "What is the after-action report?",
      "Can I share a run?",
      "Is there a decision trail or run history?",
    ],
    keywords: [
      "replay",
      "report",
      "compare",
      "comparison",
      "share",
      "shareable",
      "link",
      "code",
      "history",
      "trail",
      "debrief",
      "afteraction",
      "after-action",
      "after",
      "action",
      "run",
      "runs",
    ],
    answer:
      "After a run you get an end-of-day report — an after-action debrief of your decisions, how each metric moved, the outcome you reached, and the signals you may have missed. You can replay the run step by step to walk your decision trail, and because the engine is deterministic, every run encodes into a short shareable link or code: anyone who opens it reconstructs the exact same run in their own browser, no server involved. You can also load two runs side by side on the Compare page to see how different choices led to different outcomes.",
    relatedLinks: [
      { label: "Compare runs", href: "/compare" },
      { label: "Play a mission", href: "/scenarios" },
    ],
    relatedQuestions: [
      "Why is it deterministic?",
      "How does the simulator work?",
      "What can I do in the Studio?",
    ],
  },
  {
    id: "studio",
    title: "Import and Studio workflow",
    category: "Studio",
    questions: [
      "What can I do in the Studio?",
      "Can I build my own scenario?",
      "How do I author a scenario?",
      "How does import work?",
      "Is there a scenario editor or builder?",
    ],
    keywords: [
      "studio",
      "builder",
      "authoring",
      "author",
      "editor",
      "create",
      "build",
      "make",
      "own",
      "custom",
      "import",
      "export",
      "scenario",
      "json",
      "validate",
      "validation",
    ],
    answer:
      "Beyond playing the built-in missions, you can author your own. The Studio is an in-browser scenario builder where you define steps, options, metric impacts, flags, outcomes, and the rules that resolve them. The Import page lets you bring in a scenario definition, which is validated against the schema before it can run, so malformed scenarios are caught early. Authored and imported scenarios run on the exact same deterministic engine as the built-ins — all of it stays in your browser.",
    relatedLinks: [
      { label: "Open the Studio", href: "/studio" },
      { label: "Import a scenario", href: "/import" },
    ],
    relatedQuestions: [
      "What are the built-in scenarios?",
      "How does the simulator work?",
      "What does this project demonstrate technically?",
    ],
  },
  {
    id: "tech-stack",
    title: "Technical stack and architecture",
    category: "Technical Design",
    questions: [
      "What technology is it built with?",
      "What is the tech stack?",
      "What technologies does it use?",
      "What is the architecture?",
      "What does this project demonstrate technically?",
    ],
    keywords: [
      "tech",
      "stack",
      "technology",
      "technologies",
      "built",
      "build",
      "architecture",
      "framework",
      "nextjs",
      "next",
      "react",
      "typescript",
      "three",
      "threejs",
      "tailwind",
      "static",
      "deployment",
      "deploy",
    ],
    answer:
      "ShipDay is built with Next.js (App Router) and React, written in TypeScript end to end. The simulator is a pure, framework-agnostic engine with a typed scenario schema, fully unit-testable on its own. Three.js powers the cinematic visuals, and the interface is styled with Tailwind around a small set of design tokens that drive the risk-state theming. Because there is no backend, database, or API, the whole app deploys as a static, browser-only experience. The result demonstrates strong typing, pure-function domain logic, deterministic state, a clean engine/UI separation, and an accessible, themed front end.",
    relatedLinks: [
      { label: "Open the Studio", href: "/studio" },
    ],
    relatedQuestions: [
      "Why is it deterministic?",
      "What does a recruiter learn from this?",
      "What can I do in the Studio?",
    ],
  },
  {
    id: "accessibility",
    title: "Accessibility and reduced motion",
    category: "Accessibility",
    questions: [
      "Is it accessible?",
      "Does it support reduced motion?",
      "What about accessibility?",
      "Is it keyboard friendly?",
      "Does it respect motion preferences?",
    ],
    keywords: [
      "accessibility",
      "accessible",
      "a11y",
      "reduced",
      "motion",
      "keyboard",
      "focus",
      "contrast",
      "aria",
      "screen",
      "reader",
      "preference",
      "preferences",
    ],
    answer:
      "Accessibility is treated as a requirement, not an afterthought. The palette is tuned for contrast — no pure white is used and text stays well above its contrast targets even in the red high-risk state. Every interactive element has a visible keyboard focus ring, and a reduced-motion contract means that when a visitor prefers reduced motion, the cinematic animations collapse to their final legible state instantly while the meaningful state changes still apply.",
    relatedLinks: [
      { label: "Play a mission", href: "/scenarios" },
    ],
    relatedQuestions: [
      "What technology is it built with?",
      "What does a recruiter learn from this?",
      "What happens if risk gets high?",
    ],
  },
  {
    id: "recruiter-value",
    title: "What the project demonstrates to recruiters",
    category: "Recruiter Summary",
    questions: [
      "What would a recruiter learn from this?",
      "What does this project demonstrate?",
      "Why is this a good portfolio project?",
      "What skills does this show?",
      "What would an employer take away from this?",
    ],
    keywords: [
      "recruiter",
      "employer",
      "hiring",
      "portfolio",
      "demonstrate",
      "demonstrates",
      "skills",
      "show",
      "showcase",
      "impress",
      "learn",
      "takeaway",
      "value",
    ],
    answer:
      "For a recruiter or hiring manager, ShipDay is evidence on two fronts. As engineering, it shows fluency with a modern stack (Next.js, React, TypeScript, Three.js), disciplined architecture (a pure, tested simulator engine kept separate from the UI), deterministic state design, deep front-end craft (a cohesive themed design system, cinematic motion, real accessibility), and the restraint to ship a polished product with no backend at all. As product thinking, the scenarios themselves show that the author understands the actual judgment calls of shipping software safely under pressure — investigate before acting, test before rushing, communicate when holding. It is a portfolio piece that demonstrates both how this engineer builds and how they think about the job.",
    relatedLinks: [
      { label: "Browse the missions", href: "/scenarios" },
      { label: "Open the Studio", href: "/studio" },
    ],
    relatedQuestions: [
      "What technology is it built with?",
      "What is ShipDay?",
      "Why is it deterministic?",
    ],
  },
];

/** Look up an entry by id (used for related-question resolution). */
export function getEntryById(id: string): KnowledgeEntry | undefined {
  return knowledgeBase.find((entry) => entry.id === id);
}

/** The exact, non-guessing fallback when no entry is a strong match. */
export const FALLBACK_ANSWER =
  "I only answer from ShipDay’s local project knowledge base, so I do not want to guess. Try asking about the simulator, scenarios, metrics, determinism, Studio, replay, comparison, or technical stack.";
