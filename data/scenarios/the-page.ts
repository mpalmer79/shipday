import type { Scenario } from "@/lib/simulator/types";
import { END_STEP_ID } from "@/lib/simulator/types";
import { FLAGS } from "./flags";

const ALERT_SNIPPET = `# pagerduty: checkout-api error rate
14:42  5xx rate 0.3% -> 11.4% over 4 min
14:42  p99 latency 240ms -> 3100ms
14:43  affected: POST /checkout/confirm (payment capture)
14:43  last deploy: 14:31, "checkout: parallel capture" (not yours)
14:44  your branch feature/split-capture: 2 of 4 PRs merged`;

const STACK_SNIPPET = `TypeError: cannot read property 'token' of undefined
  at capturePayment (checkout/capture.ts:88)
  at confirmOrder (checkout/confirm.ts:42)

// capture.ts:88 reads session.token. The 14:31 deploy made
// capture run before the session middleware on one code path.
// Your half-merged split-capture branch added that path.`;

export const thePage: Scenario = {
  id: "the-page",
  name: "The Page",
  tagline: "Checkout is down, the cause is unclear, and your branch is half merged.",
  initialStepId: "the-page",
  initialMetrics: {
    quality: 50,
    speed: 50,
    risk: 40,
    trust: 55,
    focus: 45,
    testConfidence: 45,
  },
  steps: [
    {
      id: "the-page",
      time: "1:45 PM",
      title: "The page",
      narrative:
        "Your pager goes off in the middle of writing a test. Checkout is throwing 5xx on payment capture, error rate climbing. The last deploy was fourteen minutes ago and it was not yours, but your split-capture branch is half merged into the same code.",
      context:
        "You are now the first responder on a customer-facing outage, holding a half-done branch you have not finished reasoning about. The first decision is what to do before you understand anything.",
      systemSignals: [
        "pager: checkout-api 5xx rate 11.4% and climbing",
        "pager: p99 latency 3100ms on POST /checkout/confirm",
        "deploy log: 14:31 'checkout: parallel capture' by another team",
        "git: feature/split-capture 2 of 4 PRs merged to main",
      ],
      codeSnippet: ALERT_SNIPPET,
      options: [
        {
          id: "rollback-first",
          strong: true,
          label: "Roll back the 14:31 deploy now",
          description:
            "Stop the bleeding first. Revert to the last known good deploy, then work out why once customers are safe.",
          impact: { risk: -15, speed: 5, testConfidence: 5 },
          nextStepId: "after-rollback",
          flags: [FLAGS.incidentMitigated],
          consequence:
            "Error rate starts dropping within ninety seconds. You still do not know the cause, but customers can pay again.",
          lesson:
            "Mitigation and diagnosis are different jobs. During a customer-facing outage, stop the harm first and understand it second.",
        },
        {
          id: "capture-evidence-rollback",
          strong: true,
          label: "Capture logs and state, then roll back",
          description:
            "Spend two minutes snapshotting the failing requests and metrics, then revert the deploy.",
          impact: { risk: -10, testConfidence: 10, quality: 5, speed: -5 },
          nextStepId: "after-rollback",
          flags: [FLAGS.incidentMitigated, FLAGS.evidencePreserved],
          consequence:
            "You grab the failing traces and the error signature, then revert. The graphs ease off and you still have the evidence.",
          lesson:
            "A rollback erases the scene. Capturing evidence first costs two minutes and saves the diagnosis that has to happen anyway.",
        },
        {
          id: "diagnose-live",
          label: "Diagnose it live before touching anything",
          description:
            "Rolling back blind is guessing. Read the errors and find the real cause while it is happening.",
          impact: { risk: 10, quality: 5, focus: -5 },
          nextStepId: "live-diagnosis",
          flags: [FLAGS.incidentDiagnosed],
          consequence:
            "You start reading stack traces while customers keep hitting the error. You are learning, and the outage is still running.",
          lesson:
            "Diagnosing on a live outage trades customer pain for certainty. Sometimes worth it, but the clock is a cost you are choosing to pay.",
        },
        {
          id: "finish-then-respond",
          label: "Finish your commit, then jump in",
          description:
            "You are thirty seconds from a clean commit on your branch. Save your work first so you do not lose it.",
          impact: { risk: 15, focus: -10, trust: -5 },
          nextStepId: "live-diagnosis",
          flags: [FLAGS.dividedAttention, FLAGS.skippedValidation],
          consequence:
            "Two minutes pass before you even look at the incident. The error rate does not care about your commit.",
          lesson:
            "When you are first responder, the incident is the work. Anything you finish first is time the outage runs unattended.",
        },
      ],
    },
    {
      id: "after-rollback",
      time: "2:10 PM",
      title: "Stable, but unexplained",
      narrative:
        "The rollback worked. Error rate is back to baseline and checkout is healthy. Now you have a reverted deploy that belonged to another team, a half-merged branch of your own, and no confirmed root cause.",
      context:
        "The pressure is off the customers and onto you: stable is not the same as understood, and two changes touched this code today.",
      options: [
        {
          id: "reproduce-staging",
          strong: true,
          label: "Reproduce the failure in staging",
          description:
            "Replay the failing checkout path in staging with both changes applied and find exactly what breaks.",
          impact: { risk: -10, testConfidence: 15, quality: 5, speed: -5 },
          nextStepId: "root-cause",
          flags: [FLAGS.reproducedFailure],
          consequence:
            "It reproduces on the first try with both changes in place. The failure is real, repeatable, and now yours to read.",
          lesson:
            "A resolved incident with no reproduction is a deferred incident. Reproduce it before you call it understood.",
        },
        {
          id: "read-both-diffs",
          strong: true,
          label: "Read both changes side by side",
          description:
            "Put the 14:31 deploy and your two merged PRs next to each other and look for the interaction.",
          impact: { quality: 10, risk: -5, testConfidence: 5 },
          nextStepId: "root-cause",
          flags: [FLAGS.investigatedTest],
          consequence:
            "The two diffs touch the same capture path. Neither is wrong alone; together they reorder the session middleware.",
          lesson:
            "Outages from a single deploy are easy. Outages from two interacting changes need both diffs in view at once.",
        },
        {
          id: "blame-their-deploy",
          label: "Call it their deploy and close the incident",
          description:
            "Their change was last in, the rollback fixed it, so it was their bug. Mark it resolved and move on.",
          impact: { risk: 15, trust: -5, testConfidence: -10 },
          nextStepId: "root-cause",
          flags: [FLAGS.skippedValidation],
          consequence:
            "You close it as their fault. Your half-merged branch, which set up the broken path, is still sitting in main.",
          lesson:
            "Last deploy in is a suspect, not a verdict. Closing on the convenient cause leaves the real one in the codebase.",
        },
        {
          id: "redeploy-theirs",
          label: "Re-deploy their change to see if it breaks again",
          description:
            "Maybe it was a fluke. Push their deploy back out and watch whether the error returns.",
          impact: { risk: 20, testConfidence: -5 },
          nextStepId: "root-cause",
          flags: [FLAGS.skippedValidation],
          consequence:
            "Checkout starts erroring again within a minute. You confirmed the cause by handing customers the outage a second time.",
          lesson:
            "Production is an expensive place to test a hypothesis. Re-triggering an outage to confirm it is a cost customers pay for you.",
        },
      ],
    },
    {
      id: "live-diagnosis",
      time: "2:10 PM",
      title: "Diagnosing in the fire",
      narrative:
        "Checkout is still failing while you read. The stack trace points at payment capture reading a session token that is sometimes undefined. The error count keeps ticking up in the corner of your screen.",
      context:
        "You are closer to the cause than someone who rolled back blind, but every minute spent reading is a minute of customers unable to pay.",
      codeSnippet: STACK_SNIPPET,
      options: [
        {
          id: "mitigate-now",
          strong: true,
          label: "You have enough. Roll back now",
          description:
            "The trace points at the capture ordering. Stop the outage now and finish the analysis with customers safe.",
          impact: { risk: -20, testConfidence: 5, speed: 5 },
          nextStepId: "root-cause",
          flags: [FLAGS.incidentMitigated],
          consequence:
            "You revert and the errors stop. You spent real customer time to get here, but you also know where to look.",
          lesson:
            "Diagnosis has a stopping rule: the moment you know enough to mitigate, mitigate. Certainty past that point is bought with customer pain.",
        },
        {
          id: "feature-flag-off",
          strong: true,
          label: "Disable the new capture path by flag",
          description:
            "Both changes sit behind the capture flag. Turn it off to route around the break without a full rollback.",
          impact: { risk: -15, testConfidence: 5, quality: 5 },
          nextStepId: "root-cause",
          flags: [FLAGS.incidentMitigated, FLAGS.usedFeatureFlag],
          consequence:
            "Traffic moves back to the old capture path and the errors stop. The broken code is still in main, contained behind the flag.",
          lesson:
            "A flag is the fastest mitigation when the broken code is already behind one. Reach for the smallest lever that stops the harm.",
        },
        {
          id: "keep-reading",
          label: "Keep reading until you are certain",
          description:
            "You are close. Trace it all the way down before you touch anything, so you fix it once.",
          impact: { risk: 20, quality: 5, focus: -5 },
          nextStepId: "root-cause",
          flags: [FLAGS.skippedValidation],
          consequence:
            "Ten more minutes of certainty while the outage runs. You understand it completely now, and so do the customers who left.",
          lesson:
            "Full certainty during a live outage is a luxury bought with customer time. Mitigate at good enough, not at perfect.",
        },
        {
          id: "hotfix-forward",
          label: "Write a hotfix and roll forward",
          description:
            "You see the fix. Patch the ordering, push it straight to production, skip the rollback.",
          impact: { risk: 25, speed: 5, testConfidence: -10 },
          nextStepId: "root-cause",
          flags: [FLAGS.shippedDirect, FLAGS.skippedValidation],
          consequence:
            "You push an unreviewed fix into a live incident. It might work. It is also a second untested change on the same hot path.",
          lesson:
            "Rolling forward during an incident adds an unverified change to a system already on fire. Roll back to known good first.",
        },
      ],
    },
    {
      id: "root-cause",
      time: "2:45 PM",
      title: "The interaction",
      narrative:
        "The picture comes together. The 14:31 deploy moved payment capture earlier in the request. Your half-merged split-capture branch added a code path that runs capture before the session middleware attaches the token. Alone, each change is fine. Together, they drop the token.",
      context:
        "The outage was not one team's bug. It was two reasonable changes meeting in the same path, and one of them is yours and only half landed.",
      options: [
        {
          id: "write-postmortem-note",
          strong: true,
          label: "Write down the interaction while it is fresh",
          description:
            "Capture the two-change interaction, the timeline, and the token ordering in the incident doc now.",
          impact: { quality: 10, trust: 5, testConfidence: 5 },
          nextStepId: "your-branch",
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "The incident doc now explains the real cause, not a guess. The other team reads it and stops blaming their deploy.",
          lesson:
            "The root cause is clearest the moment you find it. Writing it down then beats reconstructing it for the review tomorrow.",
        },
        {
          id: "add-regression-test",
          strong: true,
          label: "Add a test that catches the interaction",
          description:
            "Write the test that fails when capture runs before the session token attaches, so this cannot recur silently.",
          impact: { testConfidence: 15, quality: 10, risk: -10, speed: -5 },
          nextStepId: "your-branch",
          flags: [FLAGS.investigatedTest],
          consequence:
            "The new test fails on the broken ordering and passes once it is fixed. The interaction now has a tripwire.",
          lesson:
            "An incident you cannot reproduce in a test will happen again. The fix is not done until a test would have caught it.",
        },
        {
          id: "quiet-fix",
          label: "Fix it quietly and tell no one",
          description:
            "It was partly your branch. Patch the ordering, say nothing, avoid the awkward conversation.",
          impact: { trust: -15, risk: 5, quality: -5 },
          nextStepId: "your-branch",
          flags: [FLAGS.skippedValidation],
          consequence:
            "You bury your part. The other team spends the afternoon auditing a deploy that was only half the problem.",
          lesson:
            "Hiding your share of an incident protects your comfort and nobody else. The cost lands on whoever you let keep looking.",
        },
        {
          id: "ship-quick-patch",
          label: "Push the ordering fix straight to production",
          description:
            "You know the fix. Skip review, get it out, close the incident before the hour is up.",
          impact: { risk: 15, speed: 10, testConfidence: -10 },
          nextStepId: "your-branch",
          flags: [FLAGS.shippedDirect, FLAGS.skippedValidation],
          consequence:
            "The patch goes out unreviewed. It happens to be right, but you would not have known if it was not.",
          lesson:
            "Knowing the fix and verifying the fix are different. An unreviewed patch on a hot path is a bet you did not have to make.",
        },
      ],
    },
    {
      id: "your-branch",
      time: "3:15 PM",
      title: "Your half-merged branch",
      narrative:
        "Checkout is stable and the cause is understood. That leaves your split-capture branch: two of four PRs merged, the half that helped cause this, the other half still in review. It cannot stay as it is.",
      context:
        "The incident is contained, but main is running half of your feature, and that half is exactly the part that interacts badly with capture ordering.",
      options: [
        {
          id: "revert-your-half",
          strong: true,
          label: "Revert your two merged PRs",
          description:
            "Take your half-feature out of main so it stops contributing to the broken path, and re-land it whole later.",
          impact: { risk: -15, quality: 10, testConfidence: 5, speed: -5 },
          nextStepId: "the-call",
          flags: [FLAGS.incidentMitigated],
          consequence:
            "Main is back to a coherent state: no half-feature, no broken interaction. Your branch waits until it can land in one piece.",
          lesson:
            "A half-merged feature is a half-tested feature. If its first half caused an incident, the safe state is none of it, not most of it.",
        },
        {
          id: "finish-your-branch",
          label: "Rush the remaining two PRs in now",
          description:
            "The other half completes the feature and might fix the ordering. Land it now and make the feature whole.",
          impact: { risk: 20, speed: 10, testConfidence: -10 },
          nextStepId: "the-call",
          flags: [FLAGS.shippedDirect, FLAGS.skippedValidation],
          consequence:
            "You merge two under-reviewed PRs into a system that went down an hour ago. The feature is whole and barely tested.",
          lesson:
            "Finishing a risky change faster does not make it safer. Completing a feature into a fresh incident doubles the bet.",
        },
        {
          id: "leave-it-flagged",
          strong: true,
          label: "Leave it merged but disabled behind the flag",
          description:
            "Keep the code in main but hold the capture flag off, so the half-feature is present and inert until finished.",
          impact: { risk: -5, quality: 5, testConfidence: 5 },
          nextStepId: "the-call",
          flags: [FLAGS.usedFeatureFlag, FLAGS.stagedRelease],
          consequence:
            "The half-feature stays in main but does nothing, gated off until the other two PRs land and the path is tested end to end.",
          lesson:
            "A flag lets unfinished code live in main without running. Inert is a safe state for a half-feature; active is not.",
        },
        {
          id: "ignore-branch",
          label: "Leave the branch alone for now",
          description:
            "The incident is over and it is late. Your branch can wait until tomorrow; do not touch it tonight.",
          impact: { risk: 10, trust: -5 },
          nextStepId: "the-call",
          flags: [FLAGS.skippedValidation],
          consequence:
            "Main keeps running the live half-feature overnight, on the path that just caused an outage, with nobody watching it.",
          lesson:
            "Walking away from a known-risky state is a decision to run it unattended. The half-feature does not pause because you went home.",
        },
      ],
    },
    {
      id: "the-call",
      time: "4:00 PM",
      title: "The call to make",
      narrative:
        "Your lead pings: \"Checkout looks healthy again. What is the state, and are we safe for the evening?\" The on-call shift changes at 6:00 PM and whoever takes it inherits whatever you decide now.",
      context:
        "Whatever you report becomes the official status the evening is planned around, and the night shift gets the state you leave, not the one you meant to leave.",
      options: [
        {
          id: "honest-status",
          strong: true,
          label: "Give the full state and what is still open",
          description:
            "Report what failed, what mitigated it, the confirmed cause, and what is still unverified before you call it closed.",
          impact: { trust: 10, risk: -10, testConfidence: 5 },
          nextStepId: "the-comms",
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "Your lead gets a clear picture and the night shift gets a real handoff. The open items are written down, not in your head.",
          lesson:
            "A status report is the state someone else acts on. Report what is verified and what is still open, not just the good news.",
        },
        {
          id: "all-clear",
          label: "Call it fully resolved",
          description:
            "Checkout is healthy and the cause is known. Say it is handled and let everyone move on.",
          impact: { risk: 15, trust: 5, speed: 5 },
          nextStepId: "the-comms",
          flags: [FLAGS.shippedDirect],
          consequence:
            "You declare all clear. Anything still unverified is now something the night shift will discover on their own.",
          lesson:
            "All clear is a promise about what you checked. Saying it past what you verified moves the surprise onto the next shift.",
        },
        {
          id: "freeze-everything",
          label: "Freeze all deploys and say little",
          description:
            "Lock the pipeline until further notice. Better safe than another incident; details can wait.",
          impact: { risk: -10, trust: -15, speed: -10 },
          nextStepId: "the-comms",
          flags: [FLAGS.blockedRelease],
          consequence:
            "You freeze every team's deploys without explaining why. Three teams hit a locked pipeline and nobody knows the reason.",
          lesson:
            "A freeze can be the right call, but an unexplained one reads as panic. Scope the caution and say why, or it just blocks everyone.",
        },
        {
          id: "delay-with-reason",
          strong: true,
          label: "Hold your feature, in writing, with a date",
          description:
            "Keep deploys open for others, hold your split-capture work, and write down why and when it lands.",
          impact: { risk: -10, trust: 5, speed: -5 },
          nextStepId: "the-comms",
          flags: [FLAGS.delayedRelease, FLAGS.communicatedTradeoffs],
          consequence:
            "Other teams keep shipping. Your feature waits for a complete, tested landing, and everyone knows the reason and the date.",
          lesson:
            "Scope the hold to the thing that is actually risky. Holding your own unfinished work is precise; freezing everyone is not.",
        },
      ],
    },
    {
      id: "the-comms",
      time: "4:40 PM",
      title: "Closing it out",
      narrative:
        "The incident is mitigated and the day is nearly over. What remains is how it gets remembered: the review, the other team, and the night shift all read what you write in the next ten minutes.",
      context:
        "How an incident closes shapes whether the next one goes better. The last decision is what you say and to whom.",
      options: [
        {
          id: "blameless-review",
          strong: true,
          label: "Schedule a blameless review with the timeline",
          description:
            "Book the review, attach the timeline and the two-change interaction, and name no culprit.",
          impact: { trust: 10, quality: 10, testConfidence: 5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "Both teams come to a review that focuses on the interaction and the missing test, not on who deployed last.",
          lesson:
            "Incidents are caused by systems more often than by people. A blameless review gets the real cause; a blame hunt gets a quiet team.",
        },
        {
          id: "brief-nightshift",
          strong: true,
          label: "Brief the night shift and hand off cleanly",
          description:
            "Walk the next on-call through what happened, what is open, and the one thing to watch tonight.",
          impact: { trust: 5, risk: -10, testConfidence: 5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.communicatedTradeoffs, FLAGS.stagedRelease],
          consequence:
            "The night shift starts informed, with the watch items and the rollback steps in hand instead of in your memory.",
          lesson:
            "An incident does not end at shift change; it transfers. A clean handoff is the difference between continuity and a cold start.",
        },
        {
          id: "move-on",
          label: "Close the ticket and head out",
          description:
            "It is fixed and it is late. Mark the incident resolved and leave the writeup for some other time.",
          impact: { trust: -10, testConfidence: -5, speed: 5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.skippedValidation],
          consequence:
            "The ticket closes with no writeup. By next week the timeline is gone and the missing test never gets added.",
          lesson:
            "An incident with no writeup teaches nothing and repeats. The ten minutes after it closes are the cheapest learning you will get.",
        },
        {
          id: "blame-other-team",
          label: "Note that the other team's deploy caused it",
          description:
            "Their deploy was the trigger. Make sure the record reflects that it started with their change.",
          impact: { trust: -20, risk: 5, quality: -5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.skippedValidation],
          consequence:
            "Your note pins it on them and leaves out your half-merged branch. They notice, and the next incident gets a less honest timeline.",
          lesson:
            "Pinning an incident on one team buys you a clean record once and a defensive blame culture forever. Accuracy is cheaper long term.",
        },
      ],
    },
  ],
  outcomes: [
    {
      id: "safe-rollout",
      time: "4:55 PM",
      title: "Clean Recovery",
      summary:
        "The outage was mitigated in minutes, the two-change interaction was found and tested, and your half-feature was put back into a safe state. Checkout is healthy, the cause is written down, and the night shift starts informed. The incident became a tripwire test instead of a recurring surprise.",
      tone: "positive",
    },
    {
      id: "minor-issue",
      time: "4:55 PM",
      title: "Rough but Contained",
      summary:
        "Checkout recovered and the day ended stable, but the response left edges: some customer time spent diagnosing in the open, or a fix landed faster than it was verified. Nothing burning tonight, and a cleaner response would have left less for the next shift to wonder about.",
      tone: "mixed",
    },
    {
      id: "customer-incident",
      time: "4:55 PM",
      title: "Prolonged Outage",
      summary:
        "The outage ran longer than it had to. Attention was split, mitigation came late, or an unverified change went onto the fire and kept it going. Customers could not check out for an extended window, and the postmortem timeline starts with the minutes that were spent on everything except stopping the harm.",
      tone: "negative",
    },
    {
      id: "responsible-delay",
      time: "4:55 PM",
      title: "Held and Explained",
      summary:
        "The incident was handled, and your half-merged feature was held back on purpose, in writing, with a date to land it whole. Other teams kept shipping. The feature arrives a little later, fully tested, and nobody inherits a half-feature on the path that just went down.",
      tone: "neutral",
    },
    {
      id: "overcontrolled",
      time: "4:55 PM",
      title: "Frozen Solid",
      summary:
        "The bleeding stopped, and then so did everything else. A blanket freeze went out with no explanation, three teams hit a locked pipeline, and the caution that might have been reasonable read as panic. The incident was contained; the response was not scoped.",
      tone: "negative",
    },
  ],
  outcomeRules: [
    {
      outcomeId: "customer-incident",
      priority: 1,
      when: {
        kind: "anyOf",
        conditions: [
          { kind: "metricAtLeast", metric: "risk", value: 85 },
          {
            kind: "allOf",
            conditions: [
              { kind: "lacksFlag", flag: FLAGS.incidentMitigated },
              { kind: "hasFlag", flag: FLAGS.shippedDirect },
              { kind: "metricAtLeast", metric: "risk", value: 70 },
            ],
          },
        ],
      },
    },
    {
      outcomeId: "overcontrolled",
      priority: 2,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "hasFlag", flag: FLAGS.blockedRelease },
          { kind: "lacksFlag", flag: FLAGS.communicatedTradeoffs },
          { kind: "metricAtMost", metric: "trust", value: 50 },
        ],
      },
    },
    {
      outcomeId: "responsible-delay",
      priority: 3,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "hasFlag", flag: FLAGS.delayedRelease },
          { kind: "hasFlag", flag: FLAGS.communicatedTradeoffs },
        ],
      },
    },
    {
      outcomeId: "safe-rollout",
      priority: 4,
      when: {
        kind: "allOf",
        conditions: [
          { kind: "metricAtMost", metric: "risk", value: 40 },
          { kind: "metricAtLeast", metric: "testConfidence", value: 55 },
          { kind: "hasFlag", flag: FLAGS.incidentMitigated },
        ],
      },
    },
  ],
  fallbackOutcomeId: "minor-issue",
  missedSignals: {
    [FLAGS.skippedValidation]:
      "The outage was treated as something to close fast rather than understand, so time went to everything except confirming the cause.",
    [FLAGS.dividedAttention]:
      "First responder and feature author were the same person, and splitting attention between them let the outage run unattended.",
    [FLAGS.shippedDirect]:
      "An unverified change went onto a system that was already failing, betting that the fix was right instead of checking.",
    [FLAGS.blockedRelease]:
      "A blanket deploy freeze went out with no explanation, so other teams hit a locked pipeline without knowing why or for how long.",
  },
};
