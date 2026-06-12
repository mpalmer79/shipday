import type { Scenario } from "@/lib/simulator/types";
import { END_STEP_ID } from "@/lib/simulator/types";
import { FLAGS } from "./flags";

const FLAKY_TEST_SNIPPET = `test("order events are emitted after sync", async () => {
  const broker = await startBroker();
  publishOrder(testOrder);

  await new Promise((resolve) => setTimeout(resolve, 50));

  // Passes when the broker syncs within 50ms.
  // On a loaded CI runner, sometimes it does not.
  expect(broker.events).toContainEqual({
    type: "order.synced",
    id: testOrder.id,
  });
});`;

export const theBrokenBuild: Scenario = {
  id: "the-broken-build",
  name: "The Broken Build",
  tagline: "Main is red, the release is at 3:00 PM, and the suspect is out sick.",
  initialStepId: "main-is-red",
  initialMetrics: {
    quality: 50,
    speed: 45,
    risk: 30,
    trust: 55,
    focus: 65,
    testConfidence: 40,
  },
  steps: [
    {
      id: "main-is-red",
      time: "9:00 AM",
      title: "Main is red",
      narrative:
        "Fourteen notifications before your first coffee. Main has been failing since 11:40 PM. Dana (release manager): \"Release train leaves at 3:00 PM. Is this happening or not?\"",
      context:
        "The failing job is an integration test with a reputation. Sam's order-pipeline refactor landed in pieces yesterday before they went home sick. Eleven commits sit between you and the last green build.",
      systemSignals: [
        "❌ integration.order_sync: expected event 'order.synced', received none (failed 3 of last 5 runs)",
        "✓ unit suites: 412 passed",
        "✓ lint, typecheck: passed",
        "⚠️  last green build on main: yesterday 4:12 PM, 11 commits ago",
        "⚠️  refactor/order-pipeline: 2 of 5 planned PRs merged",
      ],
      options: [
        {
          id: "rerun-ci",
          label: "Re-run the pipeline and hope",
          description:
            "It failed 3 of 5. That means it passed 2 of 5. One more click might get a green.",
          impact: { speed: 5, risk: 10, testConfidence: -5 },
          nextStepId: "flaky-suspect",
          flags: [FLAGS.skippedValidation],
          consequence:
            "It passes on the fourth re-run. You now have a green build and no idea what is wrong.",
          lesson:
            "A re-run that changes the result is not a fix. It is a measurement telling you the failure is nondeterministic.",
        },
        {
          id: "reproduce-locally",
          strong: true,
          label: "Reproduce the failure locally",
          description:
            "Pull main, run the failing test in a loop, and get the failure happening on your own machine before touching anything.",
          impact: { speed: -5, risk: -10, testConfidence: 10, quality: 5 },
          nextStepId: "flaky-suspect",
          flags: [FLAGS.reproducedFailure],
          consequence:
            "Forty minutes of looping and you have it: fails roughly one run in four, always on the same assertion.",
          lesson:
            "A bug you can reproduce on demand is a bug you can fix. A bug you cannot reproduce is a guess with a deadline.",
        },
        {
          id: "read-failure-output",
          strong: true,
          label: "Read the full failure output first",
          description:
            "Before running anything, read the CI logs end to end. The failure already happened five times; the evidence is sitting there.",
          impact: { risk: -5, quality: 5, focus: 5 },
          nextStepId: "flaky-suspect",
          flags: [FLAGS.inspectedExistingCode],
          consequence:
            "The logs show the missing event arrives 80ms late on failing runs. That is a timing problem, not a logic problem.",
          lesson:
            "Logs from a real failure are worth more than a theory about one. Read what happened before deciding what should have happened.",
        },
        {
          id: "ask-channel",
          label: "Ask the team channel what changed",
          description:
            "Post the failing job and ask who touched the order pipeline yesterday. Someone may already know.",
          impact: { trust: 5, speed: -5, risk: -5 },
          nextStepId: "flaky-suspect",
          flags: [FLAGS.askedClarifyingQuestions],
          consequence:
            "Two replies: the test has flaked before, and Sam's refactor changed broker startup. Both leads in one message.",
          lesson:
            "The team's collective memory is a debugging tool. Asking early costs one message; not asking costs a morning.",
        },
        {
          id: "revert-suspect",
          label: "Revert Sam's refactor now",
          description:
            "The refactor is the obvious suspect and Sam is out. Revert the two merged PRs and get main green.",
          impact: { speed: 10, risk: 10, trust: -10, quality: -5 },
          nextStepId: "flaky-suspect",
          flags: [FLAGS.skippedValidation],
          consequence:
            "Main goes green. You reverted a colleague's work on suspicion, and the test fails again an hour later.",
          lesson:
            "Reverting on suspicion instead of evidence has a cost: if you are wrong, you broke someone's work and the bug is still there.",
        },
      ],
    },
    {
      id: "flaky-suspect",
      time: "10:00 AM",
      title: "The flaky suspect",
      narrative:
        "You pull up the failing test. It publishes an order, sleeps 50 milliseconds, then asserts an event arrived. It has been quietly flaking for months; yesterday it started failing often enough to matter.",
      context:
        "A test that sleeps and hopes is a race condition with an assertion attached. The question is whether yesterday's refactor made the race worse or just made it visible.",
      codeSnippet: FLAKY_TEST_SNIPPET,
      options: [
        {
          id: "mark-flaky",
          label: "Tag it flaky and move on",
          description:
            "Add it to the flaky list so it stops blocking merges. The release is more important than one noisy test.",
          impact: { speed: 10, risk: 10, testConfidence: -15 },
          nextStepId: "half-merged-refactor",
          flags: [FLAGS.skippedValidation],
          consequence:
            "Merges unblock. The only test watching order sync no longer gets a vote on the release.",
          consequenceOverrides: [
            {
              when: { kind: "hasFlag", flag: FLAGS.reproducedFailure },
              text: "Merges unblock. You spent forty minutes proving this failure is real and repeatable, then filed it under noise anyway.",
            },
          ],
          lesson:
            "Quarantining a test removes the signal, not the race. Do it to unblock others, never as the fix.",
        },
        {
          id: "run-twenty-times",
          strong: true,
          label: "Run it twenty times and characterize it",
          description:
            "Loop the test and record the pattern: failure rate, which assertion, how late the event is.",
          impact: { speed: -5, testConfidence: 10, risk: -5 },
          nextStepId: "half-merged-refactor",
          flags: [FLAGS.investigatedTest],
          consequence:
            "Five failures in twenty runs, all the same assertion, event arriving 60 to 90ms late. The race is real and measurable.",
          lesson:
            "Flakiness has a rate, and a rate is data. Characterize the failure before theorizing about its cause.",
        },
        {
          id: "read-for-race",
          strong: true,
          label: "Read the test for the race condition",
          description:
            "The sleep is the tell. Trace what the test actually waits for versus what it should wait for.",
          impact: { quality: 10, risk: -5, focus: -5, testConfidence: 5 },
          nextStepId: "half-merged-refactor",
          flags: [FLAGS.investigatedTest],
          consequence:
            "The test waits for a fixed 50ms instead of waiting for the sync event. It was always a coin flip with good odds.",
          lesson:
            "Sleeps in tests encode an assumption about timing. When the system's timing changes, the assumption fails silently.",
        },
        {
          id: "delete-flaky-test",
          label: "Delete the test",
          description:
            "It has been unreliable for months. Unreliable tests are worse than no tests.",
          impact: { speed: 10, risk: 15, testConfidence: -20, quality: -5 },
          nextStepId: "half-merged-refactor",
          flags: [FLAGS.deletedFailingTest],
          consequence:
            "CI goes green. Order sync, the thing this release changes most, now has zero integration coverage.",
          lesson:
            "An unreliable test is a maintenance problem. Deleting it converts the maintenance problem into a blind spot.",
        },
      ],
    },
    {
      id: "half-merged-refactor",
      time: "11:00 AM",
      title: "The half-merged refactor",
      narrative:
        "Sam's refactor was planned as five PRs. Two landed yesterday. The remaining three are sitting in review, and Sam is offline with the flu. The merged half changes how the broker starts up.",
      context:
        "Main is currently running a hybrid: new broker startup, old event ordering. Nobody designed that combination. The release would ship it.",
      options: [
        {
          id: "bisect-commits",
          strong: true,
          label: "Bisect the eleven commits",
          description:
            "Run the failing test against each commit since the last green build and find exactly where the failure rate jumped.",
          impact: { speed: -10, risk: -15, quality: 5, testConfidence: 5 },
          nextStepId: "root-cause",
          flags: [FLAGS.bisectedHistory],
          consequence:
            "Ninety minutes, but conclusive: the failure rate jumps at Sam's second PR, the one that parallelized broker startup.",
          lesson:
            "Bisection trades time for certainty. When blame is about to land on a person, certainty is worth the time.",
        },
        {
          id: "revert-refactor",
          label: "Revert the merged half",
          description:
            "Two PRs in, three to go, author out sick. Put main back to the last designed state.",
          impact: { speed: 5, risk: 5, trust: -10 },
          nextStepId: "root-cause",
          consequence:
            "The revert is clean, but two other branches were already built on Sam's changes. Their owners find out from merge conflicts.",
          lesson:
            "A revert is not free once others have built on the change. Blast radius applies to rollbacks too.",
        },
        {
          id: "message-sam",
          strong: true,
          label: "Send Sam one focused question",
          description:
            "They are sick, not gone. One message: \"Did the startup change affect event ordering? Yes or no is plenty.\"",
          impact: { trust: 5, speed: -5, risk: -5 },
          nextStepId: "root-cause",
          flags: [FLAGS.askedClarifyingQuestions],
          consequence:
            "Reply in an hour: \"Startup is parallel now. Sync event can fire before subscribers attach. PR 3 fixes it.\" That is the whole answer.",
          lesson:
            "One precise question respects a sick colleague's time and beats an afternoon of reverse engineering their intent.",
        },
        {
          id: "finish-refactor",
          label: "Finish the refactor yourself",
          description:
            "The remaining three PRs are written and in review. Land them so main runs the design instead of half of it.",
          impact: { speed: -10, quality: 5, risk: 5, focus: -10 },
          nextStepId: "root-cause",
          consequence:
            "You land three PRs you did not write, reviewed under deadline, into a system you learned this morning.",
          lesson:
            "Completing someone's half-landed work means owning decisions you were not present for. Estimate that cost honestly.",
        },
        {
          id: "branch-from-green",
          label: "Cut the release from the last green commit",
          description:
            "Build today's release candidate from yesterday's green build and leave the diagnosis on main where it cannot hurt anyone.",
          impact: { risk: -10, speed: 5, testConfidence: 5 },
          nextStepId: "root-cause",
          consequence:
            "The release candidate is clean, eleven commits behind, and missing nothing customers were promised today.",
          lesson:
            "Releases and diagnoses do not have to share a branch. Decoupling them removes the deadline from the debugging.",
        },
      ],
    },
    {
      id: "root-cause",
      time: "1:00 PM",
      title: "Two causes, one failure",
      narrative:
        "The picture is complete: Sam's startup change lets the sync event fire before test subscribers attach, and the test was always a 50ms gamble. The refactor did not break a good test. It exposed a bad one.",
      context:
        "Two real defects: an event-ordering hazard in the merged refactor, and a test that asserts on a sleep. Fixing one leaves the other in production code or in CI.",
      options: [
        {
          id: "fix-both",
          strong: true,
          label: "Fix the ordering and rewrite the test",
          description:
            "Gate the sync event until subscribers attach, and make the test wait on the event instead of sleeping.",
          impact: { speed: -10, quality: 15, testConfidence: 15, risk: -15 },
          nextStepId: "release-checkpoint",
          flags: [FLAGS.investigatedTest],
          consequence:
            "Two small diffs. The test passes forty times in a row and now fails loudly if ordering ever regresses again.",
          lesson:
            "When a failure has two causes, fixing one makes the other invisible. Fix the defect and the detector together.",
        },
        {
          id: "fix-code-only",
          label: "Fix the ordering, leave the test",
          description:
            "The production hazard is the real problem. The test can flake at its old background rate.",
          impact: { quality: 5, risk: -5, testConfidence: -5 },
          nextStepId: "release-checkpoint",
          consequence:
            "The hazard is gone. The test keeps its coin-flip assertion and will cry wolf again some quiet Tuesday.",
          lesson:
            "A flaky detector erodes trust in every alarm after it. Production fixes that leave bad tests behind are half-finished.",
        },
        {
          id: "sleep-bandage",
          label: "Raise the sleep to 500ms",
          description:
            "The event arrives at most 90ms late. A bigger sleep makes the race unlosable, probably.",
          impact: { speed: 10, risk: 10, testConfidence: -10, quality: -10 },
          nextStepId: "release-checkpoint",
          flags: [FLAGS.skippedValidation],
          consequence:
            "Green builds all afternoon. The ordering hazard ships, and the test is now slower and still wrong.",
          consequenceOverrides: [
            {
              when: { kind: "hasFlag", flag: FLAGS.investigatedTest },
              text: "Green builds all afternoon. You measured the event arriving up to 90ms late this morning, so you know exactly which race the bigger sleep is papering over.",
            },
          ],
          lesson:
            "Widening a timing window does not remove a race. It reschedules the failure for a busier day.",
        },
        {
          id: "fix-test-only",
          label: "Rewrite the test, leave the ordering",
          description:
            "Make the test wait on the event properly. The ordering quirk has not hurt production yet.",
          impact: { testConfidence: 10, risk: 5 },
          nextStepId: "release-checkpoint",
          consequence:
            "The test is honest now, and it consistently passes, because waiting properly masks the ordering hazard you decided to keep.",
          lesson:
            "A correct test can still hide an incorrect system. Knowing what your tests cannot see is part of test design.",
        },
      ],
    },
    {
      id: "release-checkpoint",
      time: "2:30 PM",
      title: "The go or no-go",
      narrative:
        "Dana, in the release channel: \"Train leaves in 30 minutes. I need a go or no-go on the order pipeline from someone who actually knows its state. That appears to be you.\"",
      context:
        "Whatever you say next becomes the official status. Dana will repeat it to three teams and plan the evening around it.",
      options: [
        {
          id: "say-green",
          label: "Say it is handled",
          description:
            "Builds are green and the fix story is plausible. Give the go and keep the train on time.",
          impact: { speed: 10, trust: 5, risk: 15, quality: -5 },
          nextStepId: "release-call",
          flags: [FLAGS.shippedDirect],
          consequence:
            "\"Go\" goes out to three teams. Your name is on a status you have not finished verifying.",
          consequenceOverrides: [
            {
              when: { kind: "hasFlag", flag: FLAGS.deletedFailingTest },
              text: "\"Go\" goes out to three teams, vouching for a pipeline whose only integration test you deleted this morning.",
            },
            {
              when: { kind: "hasFlag", flag: FLAGS.bisectedHistory },
              text: "\"Go\" goes out to three teams. The bisection gave you real evidence this morning; the word \"handled\" is doing the rest of the work.",
            },
          ],
          lesson:
            "A status report is a promise other people build plans on. Report what you verified, not what you expect.",
        },
        {
          id: "status-with-risk",
          strong: true,
          label: "Give the exact state, including what is unverified",
          description:
            "Two sentences: what failed, what is fixed, what has not been proven yet, and what could still go wrong tonight.",
          impact: { trust: 5, risk: -10, speed: -5 },
          nextStepId: "release-call",
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "Dana reads it twice and says \"that is the first straight answer today.\" The decision now includes the actual risk.",
          lesson:
            "Precise uncertainty is a deliverable. \"Fixed, except X is unverified\" lets others make real decisions; \"should be fine\" does not.",
        },
        {
          id: "ask-slip-day",
          label: "Ask for a 24 hour slip",
          description:
            "Request tomorrow's train instead, with the reason in writing: the pipeline changed shape yesterday and soak time matters.",
          impact: { speed: -10, risk: -10, trust: -5 },
          nextStepId: "release-call",
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "Dana pushes back hard, then takes it to the teams with your written reason attached. The option is on the table.",
          lesson:
            "Asking for time costs credibility only when the reason is vague. A specific reason converts a slip into a plan.",
        },
        {
          id: "canary-proposal",
          strong: true,
          label: "Propose shipping to the canary fleet only",
          description:
            "Give a conditional go: the 3:00 PM train ships to the 5 percent canary fleet, full rollout after two clean hours.",
          impact: { risk: -10, testConfidence: 5, speed: -5 },
          nextStepId: "release-call",
          flags: [FLAGS.stagedRelease],
          consequence:
            "Dana likes having a middle option. The train leaves on time; it just does not visit every customer tonight.",
          lesson:
            "Go and no-go are not the only answers. Engineering judgment often looks like designing the third option.",
        },
      ],
    },
    {
      id: "release-call",
      time: "4:00 PM",
      title: "The release call",
      narrative:
        "The train is loaded. Dana hands you the final call on the order pipeline: full fleet, canary, or hold. The day's evidence is all you get.",
      context:
        "Order sync is the most-changed code in this release. How much of the fleet sees it tonight, and what gets said about it, is the last decision of the day.",
      options: [
        {
          id: "full-release",
          label: "Full release to the whole fleet",
          description:
            "Green is green. Ship it everywhere and be done with this day.",
          impact: { speed: 10, risk: 15 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.shippedDirect],
          consequence:
            "Every order in production now flows through the pipeline that was failing this morning.",
          lesson:
            "Shipping everything at once means your first production signal arrives at full volume. Decide if you can afford the broadcast.",
        },
        {
          id: "canary-release",
          strong: true,
          label: "Canary fleet tonight, full fleet after soak",
          description:
            "5 percent of traffic overnight with order-sync alerts on, ramp in the morning if the graphs stay flat.",
          impact: { risk: -10, trust: 5, quality: 5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.usedFeatureFlag, FLAGS.stagedRelease],
          consequence:
            "The canary takes tonight's traffic first. If the ordering hazard has a second act, it plays to a small audience.",
          lesson:
            "A canary is a question you ask production politely. Full rollout asks the same question with no way to retract it.",
        },
        {
          id: "hold-communicate",
          strong: true,
          label: "Hold the pipeline and say exactly why",
          description:
            "Pull order-sync from tonight's train. Write down what is unverified, what it risks, and the ship date.",
          impact: { speed: -10, trust: 5, risk: -15 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.delayedRelease, FLAGS.communicatedTradeoffs],
          consequence:
            "The rest of the train ships on time. Order sync waits a day, and everyone who cares knows the reason and the date.",
          lesson:
            "Holding one risky component while the rest ships is a precision tool. Use scope, not the calendar, to control risk.",
        },
        {
          id: "hold-silent",
          label: "Hold it and log off",
          description:
            "Pull it from the train and sort out the explanations Monday. You have been firefighting since 9:00 AM.",
          impact: { speed: -10, trust: -15, risk: -10 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.blockedRelease],
          consequence:
            "Three teams planned around a component that silently is not there. Dana finds out from the deploy manifest.",
          lesson:
            "An unannounced hold breaks more plans than a risky ship. The hold can be right and the silence still wrong.",
        },
      ],
    },
  ],
  outcomes: [
    {
      id: "safe-rollout",
      time: "4:30 PM",
      title: "Safe Rollout",
      summary:
        "The canary fleet takes the new pipeline first and the graphs stay flat. The diagnosis was methodical, the fix was verified, and the rollout was shaped so that a surprise would have been small. Main is green and deserves to be.",
      tone: "positive",
    },
    {
      id: "minor-issue",
      time: "4:30 PM",
      title: "Minor Production Issue",
      summary:
        "The release goes out and mostly behaves. One burst of order-sync retries pages on-call at 11:00 PM; the cause is found quickly because some of today's diagnosis was real. A cleaner day's work would have kept the pager quiet.",
      tone: "mixed",
    },
    {
      id: "customer-incident",
      time: "4:30 PM",
      title: "Customer Impact Incident",
      summary:
        "Order events arrive out of order across the fleet within two hours. Duplicate confirmations go out, the pipeline is rolled back at 1:00 AM, and the postmortem timeline starts with this morning's first guess. The evidence was available all day; the shortcuts outran it.",
      tone: "negative",
    },
    {
      id: "responsible-delay",
      time: "4:30 PM",
      title: "Responsible Delay",
      summary:
        "Order sync sits out tonight's train, in writing, with a reason and a date. The rest of the release ships clean. Tomorrow the pipeline goes out verified, and the only cost was one day everyone got to plan for.",
      tone: "neutral",
    },
    {
      id: "overcontrolled",
      time: "4:30 PM",
      title: "Overcontrolled Delivery",
      summary:
        "The hold might have been defensible; nobody got the chance to find out. Three teams discover the gap on their own, Dana rebuilds the evening plan from the deploy manifest, and the diagnosis work that justified the hold stays invisible.",
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
          { kind: "metricAtLeast", metric: "risk", value: 77 },
          {
            kind: "allOf",
            conditions: [
              { kind: "hasFlag", flag: FLAGS.deletedFailingTest },
              { kind: "hasFlag", flag: FLAGS.shippedDirect },
              { kind: "hasFlag", flag: FLAGS.skippedValidation },
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
          { kind: "metricAtMost", metric: "risk", value: 45 },
          { kind: "metricAtLeast", metric: "testConfidence", value: 45 },
          {
            kind: "anyOf",
            conditions: [
              { kind: "hasFlag", flag: FLAGS.usedFeatureFlag },
              { kind: "hasFlag", flag: FLAGS.stagedRelease },
            ],
          },
        ],
      },
    },
  ],
  fallbackOutcomeId: "minor-issue",
  missedSignals: {
    [FLAGS.skippedValidation]:
      "The failure was reproducible and measurable, but the morning ran on re-runs and suspicion instead of evidence.",
    [FLAGS.deletedFailingTest]:
      "The only integration test watching order sync was removed under deadline, trading a maintenance problem for a blind spot.",
    [FLAGS.shippedDirect]:
      "The go-ahead went to three teams before the fix was verified, turning an expectation into a status others planned around.",
    [FLAGS.blockedRelease]:
      "Pulling the pipeline may have been right, but three teams learned it was missing from the deploy manifest, not from you.",
  },
};
