import type { Scenario } from "@/lib/simulator";
import { END_STEP_ID } from "@/lib/simulator";

/**
 * A small, valid scenario offered on the import page so a visitor has
 * something to paste, edit, and play. Kept in its own module (not in the
 * client component) so the verify script can hold it to the same copy and
 * validity checks as the built-in scenarios.
 */
export const SAMPLE_SCENARIO: Scenario = {
  id: "sample-config-toggle",
  name: "Sample: A Config Toggle",
  tagline: "A tiny two-step scenario you can edit and replay.",
  initialStepId: "config-toggle",
  initialMetrics: {
    quality: 50,
    speed: 50,
    risk: 30,
    trust: 55,
    focus: 60,
    testConfidence: 50,
  },
  steps: [
    {
      id: "config-toggle",
      time: "10:00 AM",
      title: "A config toggle",
      narrative:
        "A small config flag controls a new code path. Someone asks you to turn it on for everyone today.",
      context:
        "The flag has not been exercised under real traffic. Turning it on is one line and three unknowns.",
      options: [
        {
          id: "read-consumers",
          label: "Read what the flag actually controls first",
          description:
            "Find every code path the flag gates before flipping it.",
          impact: { risk: -10, quality: 5 },
          nextStepId: "the-call",
        },
        {
          id: "flip-now",
          label: "Flip it on for everyone now",
          description:
            "It is one flag. Turn it on and move to the next ticket.",
          impact: { risk: 15, speed: 10 },
          nextStepId: "the-call",
        },
      ],
    },
    {
      id: "the-call",
      time: "11:00 AM",
      title: "The rollout call",
      narrative: "Time to decide how the change reaches production.",
      context: "The same change can ship safely or all at once. Your call.",
      options: [
        {
          id: "stage-it",
          label: "Roll out behind the flag in stages",
          description: "Ramp slowly and watch the error rate.",
          impact: { risk: -5, trust: 5 },
          nextStepId: END_STEP_ID,
          flags: ["used-feature-flag"],
        },
        {
          id: "ship-everywhere",
          label: "Turn it on everywhere at once",
          description: "Full rollout, right now.",
          impact: { risk: 15 },
          nextStepId: END_STEP_ID,
        },
      ],
    },
  ],
  outcomes: [
    {
      id: "safe-rollout",
      time: "11:30 AM",
      title: "Safe Rollout",
      summary:
        "The change reached users behind a flag and the graphs stayed flat.",
      tone: "positive",
    },
    {
      id: "minor-issue",
      time: "11:30 AM",
      title: "Minor Production Issue",
      summary: "A small problem surfaced and was cleaned up quickly.",
      tone: "mixed",
    },
    {
      id: "customer-incident",
      time: "11:30 AM",
      title: "Customer Impact Incident",
      summary: "The untested path broke for users and had to be rolled back.",
      tone: "negative",
    },
    {
      id: "responsible-delay",
      time: "11:30 AM",
      title: "Responsible Delay",
      summary:
        "The change waited for verification, with the reason written down.",
      tone: "neutral",
    },
    {
      id: "overcontrolled",
      time: "11:30 AM",
      title: "Overcontrolled Delivery",
      summary:
        "The change was held with no explanation to anyone waiting on it.",
      tone: "negative",
    },
  ],
  outcomeRules: [
    {
      outcomeId: "customer-incident",
      priority: 1,
      when: { kind: "metricAtLeast", metric: "risk", value: 60 },
    },
    {
      outcomeId: "safe-rollout",
      priority: 2,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "metricAtMost", metric: "risk", value: 40 },
          { kind: "hasFlag", flag: "used-feature-flag" },
        ],
      },
    },
  ],
  fallbackOutcomeId: "minor-issue",
};
