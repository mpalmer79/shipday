import type { Condition, OutcomeId, Scenario } from "../types";
import { END_STEP_ID } from "../types";

/**
 * Test fixtures for the outcome resolver. Each is a complete, valid scenario
 * with a single deterministic path that drives the run into one rule, so a test
 * can assert the resolved outcome. Together they exercise every condition kind
 * (metricAtLeast, metricAtMost, hasFlag, lacksFlag, anyOf, allOf), reach all
 * five outcomes, and cover priority ordering and rule fallthrough. They live
 * outside data/scenarios on purpose: the registry holds production scenarios to
 * stricter design rules (option counts, distribution bounds), while these are
 * minimal probes for the engine.
 */

const BASE_METRICS = {
  quality: 50,
  speed: 50,
  risk: 30,
  trust: 60,
  focus: 70,
  testConfidence: 50,
};

const FULL_OUTCOMES: Scenario["outcomes"] = [
  { id: "safe-rollout", time: "5:00 PM", title: "Safe Rollout", summary: "It shipped clean.", tone: "positive" },
  { id: "minor-issue", time: "5:00 PM", title: "Minor Issue", summary: "A small problem, handled.", tone: "mixed" },
  { id: "customer-incident", time: "5:00 PM", title: "Customer Incident", summary: "Users were affected.", tone: "negative" },
  { id: "responsible-delay", time: "5:00 PM", title: "Responsible Delay", summary: "Held, with a reason written.", tone: "neutral" },
  { id: "overcontrolled", time: "5:00 PM", title: "Overcontrolled", summary: "Held with no word to anyone.", tone: "negative" },
];

/**
 * Builds a one-step scenario. The options are taken in array order by the
 * deterministic first-option playthrough, so the first option is the path the
 * fixture's expected outcome assumes.
 */
function oneStep(
  id: string,
  options: Scenario["steps"][number]["options"],
  outcomeRules: Scenario["outcomeRules"],
  fallbackOutcomeId: OutcomeId = "minor-issue",
  initialMetrics = BASE_METRICS
): Scenario {
  return {
    id,
    name: id,
    tagline: "A single-step resolver probe.",
    initialStepId: "only",
    initialMetrics,
    steps: [
      {
        id: "only",
        time: "9:00 AM",
        title: "Only call",
        narrative: "One decision ends the day.",
        context: "Probe.",
        options,
      },
    ],
    outcomes: FULL_OUTCOMES,
    outcomeRules,
    fallbackOutcomeId,
  };
}

/** safe-rollout via allOf(hasFlag, metricAtMost). */
export const safeRolloutFixture = oneStep(
  "fixture-safe-rollout",
  [
    {
      id: "go-carefully",
      label: "Go carefully",
      description: "Lower the risk and flag the care taken.",
      impact: { risk: -5 },
      nextStepId: END_STEP_ID,
      flags: ["worked-carefully"],
    },
  ],
  [
    {
      outcomeId: "safe-rollout",
      priority: 1,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "hasFlag", flag: "worked-carefully" },
          { kind: "metricAtMost", metric: "risk", value: 40 },
        ],
      },
    },
  ]
);

/** customer-incident via anyOf(metricAtLeast, allOf(hasFlag, hasFlag)). The
 * path takes the allOf branch (metricAtLeast stays false), so both arms of the
 * anyOf and the nested allOf are exercised. */
export const customerIncidentFixture = oneStep(
  "fixture-customer-incident",
  [
    {
      id: "rush-it",
      label: "Rush it",
      description: "Skip review and move fast.",
      impact: {},
      nextStepId: END_STEP_ID,
      flags: ["rushed", "skipped-review"],
    },
  ],
  [
    {
      outcomeId: "customer-incident",
      priority: 1,
      when: {
        kind: "anyOf",
        conditions: [
          { kind: "metricAtLeast", metric: "risk", value: 80 },
          {
            kind: "allOf",
            conditions: [
              { kind: "hasFlag", flag: "rushed" },
              { kind: "hasFlag", flag: "skipped-review" },
            ],
          },
        ],
      },
    },
  ],
  "minor-issue",
  { ...BASE_METRICS, risk: 20 }
);

/** responsible-delay via allOf(hasFlag, metricAtLeast). */
export const responsibleDelayFixture = oneStep(
  "fixture-responsible-delay",
  [
    {
      id: "document-hold",
      label: "Document the hold",
      description: "Write down why and build confidence.",
      impact: { testConfidence: 20 },
      nextStepId: END_STEP_ID,
      flags: ["documented-hold"],
    },
  ],
  [
    {
      outcomeId: "responsible-delay",
      priority: 1,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "hasFlag", flag: "documented-hold" },
          { kind: "metricAtLeast", metric: "testConfidence", value: 60 },
        ],
      },
    },
  ]
);

/** overcontrolled via allOf(hasFlag, lacksFlag, metricAtMost). The second
 * option exists only so "shipped" is a real flag the lacksFlag can reference;
 * the deterministic path takes the first (holding) option. */
export const overcontrolledFixture = oneStep(
  "fixture-overcontrolled",
  [
    {
      id: "hold-everything",
      label: "Hold everything",
      description: "Sit on the change.",
      impact: {},
      nextStepId: END_STEP_ID,
      flags: ["held"],
    },
    {
      id: "ship-it",
      label: "Ship it",
      description: "Let it go out.",
      impact: {},
      nextStepId: END_STEP_ID,
      flags: ["shipped"],
    },
  ],
  [
    {
      outcomeId: "overcontrolled",
      priority: 1,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "hasFlag", flag: "held" },
          { kind: "lacksFlag", flag: "shipped" },
          { kind: "metricAtMost", metric: "risk", value: 40 },
        ],
      },
    },
  ],
  "minor-issue",
  { ...BASE_METRICS, risk: 20 }
);

/** No rule matches, so the run falls through to the fallback (minor-issue). */
export const fallthroughFixture = oneStep(
  "fixture-fallthrough",
  [
    {
      id: "do-nothing-special",
      label: "Do nothing special",
      description: "An ordinary choice that trips no rule.",
      impact: {},
      nextStepId: END_STEP_ID,
    },
  ],
  []
);

/** Two rules both match the single path; the lower-priority number wins even
 * though it is listed second, proving resolution is by priority, not order. */
export const priorityFixture = oneStep(
  "fixture-priority",
  [
    {
      id: "go",
      label: "Go",
      description: "Set the flag and lower risk so both rules match.",
      impact: { risk: -5 },
      nextStepId: END_STEP_ID,
      flags: ["both"],
    },
  ],
  [
    {
      outcomeId: "customer-incident",
      priority: 2,
      when: { kind: "hasFlag", flag: "both" },
    },
    {
      outcomeId: "safe-rollout",
      priority: 1,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "hasFlag", flag: "both" },
          { kind: "metricAtMost", metric: "risk", value: 40 },
        ],
      },
    },
  ]
);

/**
 * The Silent Cron: a two-step scenario that resolves to safe-rollout on the
 * careful line and customer-incident on the reckless line. Used to assert two
 * distinct branches through the same scenario.
 */
export const silentCronFixture: Scenario = {
  id: "silent-cron",
  name: "The Silent Cron",
  tagline: "A nightly job stopped writing rows. Nobody noticed for a week.",
  initialStepId: "discovery",
  initialMetrics: { quality: 50, speed: 50, risk: 35, trust: 55, focus: 65, testConfidence: 45 },
  steps: [
    {
      id: "discovery",
      time: "9:00 AM",
      title: "The numbers look thin",
      narrative:
        "Finance pings you: last week's revenue report is missing roughly a fifth of its rows. The nightly reconciliation cron is the prime suspect.",
      context:
        "The cron exits 0 every night, so no alert ever fired. You have no idea yet whether data is lost or just unwritten.",
      options: [
        {
          id: "read-logs",
          label: "Pull the cron logs before touching anything",
          description: "Understand what the job actually did each night for the last week.",
          impact: { risk: -10, quality: 5, focus: 5 },
          nextStepId: "diagnose",
          flags: ["investigated-first"],
        },
        {
          id: "rerun-now",
          label: "Just re-run the job for the missing days",
          description: "Backfill first, ask questions later. Speed matters.",
          impact: { risk: 15, speed: 8, testConfidence: -5 },
          nextStepId: "diagnose",
          flags: ["acted-before-understanding"],
        },
      ],
    },
    {
      id: "diagnose",
      time: "11:30 AM",
      title: "The root cause",
      narrative:
        "A dependency bump changed a date library's default timezone. Rows past midnight UTC were silently filed under the wrong day and skipped by the report query.",
      context: "The fix is small. The question is how you ship it on a job that touches financial data.",
      options: [
        {
          id: "test-then-flag",
          label: "Add a regression test, then backfill behind a verification step",
          description: "Write the test that would have caught this, reconcile, and have someone confirm the totals.",
          impact: { risk: -12, quality: 10, trust: 8, testConfidence: 15 },
          nextStepId: END_STEP_ID,
          flags: ["wrote-regression-test", "verified-with-finance"],
        },
        {
          id: "hotfix-quiet",
          label: "Hotfix and backfill quietly to avoid noise",
          description: "Push the one-line fix and rerun. No need to alarm finance.",
          impact: { risk: 10, speed: 5, trust: -8 },
          nextStepId: END_STEP_ID,
          flags: ["skipped-verification"],
        },
      ],
    },
  ],
  outcomes: [
    { id: "safe-rollout", time: "2:00 PM", title: "Clean Reconciliation", summary: "The bug was understood, fenced with a test, and the corrected totals were signed off by finance.", tone: "positive" },
    { id: "minor-issue", time: "2:00 PM", title: "Fixed, But Unverified", summary: "The numbers look right now, but nobody confirmed them and the test that would catch a repeat was never written.", tone: "mixed" },
    { id: "customer-incident", time: "2:00 PM", title: "Double-Counted Revenue", summary: "A blind backfill ran twice over the same days and finance reported inflated numbers upward.", tone: "negative" },
    { id: "responsible-delay", time: "2:00 PM", title: "Held For Verification", summary: "The fix waited for a second set of eyes on the financial totals, with the reason documented.", tone: "neutral" },
    { id: "overcontrolled", time: "2:00 PM", title: "Stalled Without A Word", summary: "The job stayed broken another day while the fix sat unshipped and unexplained.", tone: "negative" },
  ],
  outcomeRules: [
    {
      outcomeId: "customer-incident",
      priority: 1,
      when: {
        kind: "anyOf",
        conditions: [
          { kind: "metricAtLeast", metric: "risk", value: 55 },
          {
            kind: "allOf",
            conditions: [
              { kind: "hasFlag", flag: "acted-before-understanding" },
              { kind: "hasFlag", flag: "skipped-verification" },
            ],
          },
        ],
      },
    },
    {
      outcomeId: "safe-rollout",
      priority: 2,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "hasFlag", flag: "wrote-regression-test" },
          { kind: "hasFlag", flag: "verified-with-finance" },
          { kind: "metricAtMost", metric: "risk", value: 45 },
        ],
      },
    },
    {
      outcomeId: "responsible-delay",
      priority: 3,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "hasFlag", flag: "verified-with-finance" },
          { kind: "metricAtLeast", metric: "testConfidence", value: 55 },
        ],
      },
    },
  ],
  fallbackOutcomeId: "minor-issue",
  missedSignals: {
    "acted-before-understanding":
      "The logs explained everything in two minutes. Re-running blind risked stacking a second pass on top of data that was misfiled, not missing.",
    "skipped-verification":
      "These are financial totals. Shipping a quiet fix with no second confirmation means the first person to notice an error is the auditor, not you.",
  },
};

/** A fixture and the outcome its deterministic first-option path must reach. */
export type ResolverCase = {
  scenario: Scenario;
  expected: OutcomeId;
  /** The condition kinds this fixture's rules exercise. */
  kinds: Condition["kind"][];
};

export const RESOLVER_CASES: ResolverCase[] = [
  { scenario: safeRolloutFixture, expected: "safe-rollout", kinds: ["allOf", "hasFlag", "metricAtMost"] },
  { scenario: customerIncidentFixture, expected: "customer-incident", kinds: ["anyOf", "metricAtLeast", "allOf", "hasFlag"] },
  { scenario: responsibleDelayFixture, expected: "responsible-delay", kinds: ["allOf", "hasFlag", "metricAtLeast"] },
  { scenario: overcontrolledFixture, expected: "overcontrolled", kinds: ["allOf", "hasFlag", "lacksFlag", "metricAtMost"] },
  { scenario: fallthroughFixture, expected: "minor-issue", kinds: [] },
  { scenario: priorityFixture, expected: "safe-rollout", kinds: ["hasFlag", "allOf", "metricAtMost"] },
];
