import type { Scenario } from "@/lib/simulator/types";
import { END_STEP_ID } from "@/lib/simulator/types";
import { FLAGS } from "./flags";

const STACK_TRACE_SNIPPET = `TimeoutError: checkout-client request exceeded 2000ms
  at CheckoutClient.fetchCart (checkout-client/index.ts:88)
  at resolveCart (api/checkout/route.ts:41)
  at POST (api/checkout/route.ts:19)

# Only fails on carts above ~40 line items.
# checkout-client was bumped 1.4.2 -> 1.5.0 in the last deploy.
# 1.5.0 batches cart reads into one call that can run long.`;

export const thePage: Scenario = {
  id: "the-page",
  name: "The Page",
  tagline: "A production page lands while your feature branch is half done.",
  initialStepId: "the-page",
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
      id: "the-page",
      time: "2:30 PM",
      title: "The page",
      narrative:
        "Your pager goes off. You are 200 lines into feature/saved-carts with the tests half written. The alert: checkout error rate climbing fast.",
      context:
        "You have uncommitted work and an alert that is getting worse by the minute. Two things want your full attention. Only one of them is on fire.",
      systemSignals: [
        "PAGE: checkout 5xx rate 0.4% -> 6.1% over 8 minutes",
        "PAGE: p99 latency 280ms -> 2.4s on POST /api/checkout",
        "info: your branch feature/saved-carts has 14 changed files, tests incomplete",
        "info: last production deploy was 31 minutes ago, and it was not yours",
      ],
      options: [
        {
          id: "stash-and-ack",
          strong: true,
          label: "Commit your work, then acknowledge the page",
          description:
            "Get the half-done branch saved in one command, then give the incident your full attention.",
          impact: { focus: 5, risk: -5, quality: 5 },
          nextStepId: "triage",
          consequence:
            "Your work is safe on the branch and your hands are free. Now there is only one problem in the room.",
          lesson:
            "An incident needs all of you. Protecting your unsaved work takes one command and removes a second way for the day to go wrong.",
        },
        {
          id: "keep-coding",
          label: "Finish the function you are on first",
          description:
            "You are two minutes from a clean stopping point. The page can wait that long.",
          impact: { speed: 5, risk: 15, trust: -5 },
          nextStepId: "triage",
          flags: [FLAGS.skippedValidation],
          consequence:
            "The error rate doubles while you finish a function nobody is waiting for.",
          lesson:
            "An alert that is getting worse does not pause for your flow state. The cost of the delay lands on customers, not on you.",
        },
        {
          id: "ack-and-switch",
          label: "Acknowledge and drop everything as-is",
          description:
            "Respond instantly. Leave the branch exactly where it is and pull up the dashboards.",
          impact: { risk: -5, focus: -5 },
          nextStepId: "triage",
          consequence:
            "You are on the incident in seconds, with an hour of uncommitted work one crash away from gone.",
          lesson:
            "Responding fast is right. Leaving an hour of work unsaved is a small bet you do not need to make.",
        },
        {
          id: "pull-in-someone",
          strong: true,
          label: "Acknowledge, then ask who else is online",
          description:
            "Post the alert in the channel and ask for a second set of hands before you start.",
          impact: { trust: 5, risk: -5, speed: -5 },
          nextStepId: "triage",
          flags: [FLAGS.askedClarifyingQuestions],
          consequence:
            "Two teammates raise their hands within a minute. You are not doing this alone.",
          lesson:
            "The first minute of an incident is for getting hands, not for heroics. Help asked for early is help that arrives in time.",
        },
      ],
    },
    {
      id: "triage",
      time: "2:45 PM",
      title: "Triage",
      narrative:
        "Error rate is at 6 percent and climbing. The last deploy belonged to another team. Your branch is nowhere near production. You have to pick an approach, and the approach picks your next hour.",
      context:
        "Triage is deciding what to believe first. You can chase the cause, or you can stop the bleeding. Both are defensible. Doing neither is not.",
      options: [
        {
          id: "read-dashboards",
          strong: true,
          label: "Read the dashboards and logs before touching anything",
          description:
            "Spend five minutes understanding the shape of the failure before you act on it.",
          impact: { risk: -10, quality: 5, focus: 5 },
          nextStepId: "diagnose",
          flags: [FLAGS.inspectedExistingCode],
          consequence:
            "The errors cluster on one endpoint and started right after the unrelated deploy. A lead, not yet a verdict.",
          lesson:
            "The dashboards already recorded what happened. Reading them first is faster than guessing and correcting.",
        },
        {
          id: "reproduce-incident",
          strong: true,
          label: "Reproduce the failing request yourself",
          description:
            "Pull a real cart payload and send it at staging until you see the failure with your own eyes.",
          impact: { risk: -5, testConfidence: 10, speed: -5 },
          nextStepId: "diagnose",
          flags: [FLAGS.reproducedFailure],
          consequence:
            "Third attempt reproduces the 5xx on a large cart. The graph is now a bug you can hold.",
          lesson:
            "A reproduction turns a metric into a defect. You cannot fix a number, but you can fix a request that fails on demand.",
        },
        {
          id: "rollback-last-deploy",
          label: "Roll back the last deploy on suspicion",
          description:
            "It is the obvious suspect and it is not your code. Revert it and see if the graph recovers.",
          impact: { speed: 10, risk: 5, trust: -5 },
          nextStepId: "roll-back",
          flags: [FLAGS.skippedValidation],
          consequence:
            "You revert another team's deploy with no evidence yet. It might be the cause. It might be the thing that was holding something else up.",
          lesson:
            "Rolling back on suspicion can stop the bleeding or open a new wound. Either way you owe the evidence you skipped.",
        },
        {
          id: "flip-killswitch",
          label: "Flip the checkout kill switch to shed the failing path",
          description:
            "Route checkout around the new code path so customers stop seeing errors while you work.",
          impact: { risk: -10, speed: 5 },
          nextStepId: "roll-back",
          flags: [FLAGS.mitigatedImpact],
          consequence:
            "Error rate drops as the failing path is bypassed. Customers see the old flow. The clock is no longer against you.",
          lesson:
            "Mitigation is not a fix. It is buying time, and the time it buys is exactly the point of doing it first.",
        },
      ],
    },
    {
      id: "diagnose",
      time: "3:00 PM",
      title: "Down the logs",
      narrative:
        "You chose to understand it before acting. The failing requests are in front of you and the stack trace keeps landing in the same place: a client library both teams depend on.",
      context:
        "The cause is close. The trap on this path is digging past the point where you already know enough to act.",
      codeSnippet: STACK_TRACE_SNIPPET,
      options: [
        {
          id: "find-shared-dep",
          strong: true,
          label: "Trace it to the shared library version",
          description:
            "Confirm exactly which dependency changed and what the new version does differently.",
          impact: { quality: 10, risk: -5, testConfidence: 5 },
          nextStepId: "root-cause",
          flags: [FLAGS.inspectedExistingCode],
          consequence:
            "The last deploy bumped a shared checkout client. The new version batches cart reads into one call that times out on large carts.",
          lesson:
            "A shared dependency turns one team's deploy into another team's page. The version diff is where the two stories meet.",
        },
        {
          id: "mitigate-while-diagnosing",
          strong: true,
          label: "Flip the kill switch now, keep diagnosing",
          description:
            "Stop the customer impact first so the rest of the investigation runs without a clock on it.",
          impact: { risk: -10, focus: -5 },
          nextStepId: "root-cause",
          flags: [FLAGS.mitigatedImpact],
          consequence:
            "Customers stop hitting errors. You keep reading, now with the pressure off instead of on.",
          lesson:
            "Mitigating and diagnosing are not a choice between two things. Do the first so you can afford to do the second properly.",
        },
        {
          id: "keep-digging",
          label: "Keep digging for the perfect root cause first",
          description:
            "You are close to certainty. Hold off on any action until you can explain every detail.",
          impact: { risk: 10, speed: -10 },
          nextStepId: "root-cause",
          flags: [FLAGS.skippedValidation],
          consequence:
            "Ten more minutes of certainty, bought with ten more minutes of customers hitting errors you could already have stopped.",
          lesson:
            "Past a point, more diagnosis is just risk you are choosing to keep taking. Knowing when you know enough is the skill.",
        },
        {
          id: "guess-and-patch",
          label: "Write a quick patch on a hunch and push it",
          description:
            "You think you know the line. Patch it and ship straight to production to end this now.",
          impact: { speed: 10, risk: 15, testConfidence: -10 },
          nextStepId: "root-cause",
          flags: [FLAGS.skippedValidation],
          consequence:
            "An untested hunch heads for the same production that is already on fire.",
          lesson:
            "A guess shipped into an active incident is how one incident becomes two. The hot path is the worst place to be wrong.",
        },
      ],
    },
    {
      id: "roll-back",
      time: "3:00 PM",
      title: "After the action",
      narrative:
        "You acted first and the bleeding slowed. Now you owe two things you do not have yet: a confirmed cause, and an explanation for the team whose deploy you touched.",
      context:
        "Acting first worked, this time. The cost is a tense message in the channel and a cause you have stopped but not yet proven.",
      systemSignals: [
        "ok: checkout 5xx rate 6.1% -> 0.5% after the mitigation",
        "warn: the affected deploy belonged to the payments team",
        "chat: payments-team asks why their deploy was touched",
      ],
      options: [
        {
          id: "explain-to-team",
          strong: true,
          label: "Tell the other team what you saw and why you acted",
          description:
            "Post the graph, the timing, and the action you took, before they have to ask twice.",
          impact: { trust: 5, risk: -5 },
          nextStepId: "root-cause",
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "They are not thrilled, but they are informed, and one of them joins to help find the real cause.",
          lesson:
            "Acting on someone else's change without telling them turns a fix into a grievance. The message costs a minute and saves the relationship.",
        },
        {
          id: "confirm-mitigation",
          strong: true,
          label: "Confirm the mitigation actually held",
          description:
            "Re-run the failing request and watch the real metric, not just the dashboard color.",
          impact: { testConfidence: 10, risk: -5 },
          nextStepId: "root-cause",
          flags: [FLAGS.reproducedFailure],
          consequence:
            "The request that failed minutes ago now succeeds. The mitigation is real, not a coincidence with good timing.",
          lesson:
            "A metric dropping after you act is correlation. Confirming you caused it is the difference between a fix and a hope.",
        },
        {
          id: "declare-resolved",
          label: "Mark the incident resolved, the graph looks fine",
          description:
            "Green is green. Close it out and stop the all-hands attention.",
          impact: { speed: 10, risk: 15, trust: -5 },
          nextStepId: "root-cause",
          flags: [FLAGS.skippedValidation],
          consequence:
            "You close the incident on a quiet graph and a cause you never proved.",
          lesson:
            "A quiet graph is not a root cause. Closing early is how an incident earns itself a sequel.",
        },
        {
          id: "move-on-to-feature",
          label: "Mitigation held, get back to your feature",
          description:
            "The fire is out. Reopen the branch and recover your afternoon.",
          impact: { speed: 5, risk: 10, focus: 5 },
          nextStepId: "root-cause",
          flags: [FLAGS.skippedValidation],
          consequence:
            "You reopen the branch with the cause unknown and the rollback still unexplained.",
          lesson:
            "An incident is not over when it stops hurting. It is over when you know why it started.",
        },
      ],
    },
    {
      id: "root-cause",
      time: "3:30 PM",
      title: "The actual cause",
      narrative:
        "The picture is complete. The shared checkout client, bumped in the last deploy, batches cart reads in a way that times out on large carts. Two real fixes are on the table: pin the library back, or fix the timeout path properly.",
      context:
        "You know the cause. From here it is an ordinary engineering decision under slightly less ordinary pressure: pick the fix you can still defend at 6 PM.",
      options: [
        {
          id: "pin-library",
          strong: true,
          label: "Pin the shared library to the last good version",
          description:
            "Return checkout to known behavior now and let both teams plan the real upgrade later.",
          impact: { risk: -10, quality: 5, testConfidence: 5 },
          nextStepId: "the-fix",
          flags: [FLAGS.preparedRollback],
          consequence:
            "A one-line pin puts checkout back to behavior everyone understands. The upgrade becomes a planned task, not an incident.",
          lesson:
            "During an incident, the fix that restores a known good state beats the clever fix that introduces a new unknown.",
        },
        {
          id: "proper-fix-tested",
          strong: true,
          label: "Write the real fix with a test for the large-cart case",
          description:
            "Fix the timeout handling and encode the exact failure as a test before it ships.",
          impact: { quality: 10, testConfidence: 15, speed: -10 },
          nextStepId: "the-fix",
          flags: [FLAGS.reproducedFailure],
          consequence:
            "Slower, but the fix ships with the failure that caused all this written down as a test that fails if it ever returns.",
          lesson:
            "The test you write during an incident is the one that stops the rerun. The failure is never as well understood as it is right now.",
        },
        {
          id: "quick-patch",
          label: "Raise the timeout number and ship it",
          description:
            "Bump the limit so the long call fits inside it and move on.",
          impact: { speed: 10, risk: 10, testConfidence: -5 },
          nextStepId: "the-fix",
          flags: [FLAGS.skippedValidation],
          consequence:
            "The number is bigger. Whether it is big enough is a guess you are making against the next cart you have not seen.",
          lesson:
            "Tuning a constant under fire bets that tomorrow's load looks like today's. That bet has a poor record.",
        },
        {
          id: "hand-it-back",
          label: "Hand it back to the other team and wait",
          description:
            "It is their library and their deploy. Reassign it and let them own the fix.",
          impact: { speed: -10, trust: -10, risk: 5 },
          nextStepId: "the-fix",
          consequence:
            "Checkout stays mitigated but degraded while ownership bounces between two teams.",
          lesson:
            "Not my code is true and useless during an incident. The owner is whoever is holding the page, and right now that is you.",
        },
      ],
    },
    {
      id: "the-fix",
      time: "4:00 PM",
      title: "Shipping the fix",
      narrative:
        "The fix is ready. Now the day ends the way every day in this job ends: how does it reach production, and who hears about it.",
      context:
        "It is 4 PM, the impact is mitigated, and the fix is in your hands. How you ship it is the last technical decision. How you talk about it is the last decision.",
      options: [
        {
          id: "canary-the-fix",
          strong: true,
          label: "Roll the fix to a canary and watch the metric",
          description:
            "Send the fix to a small slice of traffic and confirm the error rate stays flat before going wide.",
          impact: { risk: -10, testConfidence: 5, trust: 5 },
          nextStepId: "the-comms",
          flags: [FLAGS.stagedRelease],
          consequence:
            "Five percent of checkout takes the fix. The error rate holds flat where it counts before you ramp.",
          lesson:
            "Even a fix deserves a blast radius. An incident fix most of all, because it ships into a system that just proved it can fail.",
        },
        {
          id: "flag-and-ramp",
          strong: true,
          label: "Ship behind a flag and ramp as it holds",
          description:
            "Put the fix behind a flag so it is live but reversible in one click if the graph twitches.",
          impact: { risk: -10, quality: 5 },
          nextStepId: "the-comms",
          flags: [FLAGS.usedFeatureFlag],
          consequence:
            "The fix is in production and one click from gone. The recovery has an undo button.",
          lesson:
            "Reversibility is worth more during an incident than after one. A flag is the cheapest insurance you can buy at 4 PM.",
        },
        {
          id: "ship-it-now",
          label: "Push the fix straight to all of production",
          description:
            "The mitigation is holding and the fix is right. Send it everywhere and be done.",
          impact: { speed: 10, risk: 15 },
          nextStepId: "the-comms",
          flags: [FLAGS.shippedDirect],
          consequence:
            "The fix goes to every checkout at once, into the system you were paged about an hour ago.",
          lesson:
            "Shipping a fix at full volume assumes the fix is as right as the bug was wrong. Today is a poor day to assume.",
        },
        {
          id: "hold-for-review",
          strong: true,
          label: "Hold the fix for a second reviewer and say so",
          description:
            "The mitigation holds, so spend twenty minutes getting eyes on the fix, and tell everyone that is the plan.",
          impact: { risk: -10, speed: -10, trust: 5 },
          nextStepId: "the-comms",
          flags: [FLAGS.delayedRelease, FLAGS.communicatedTradeoffs],
          consequence:
            "The fix waits for a reviewer while the kill switch keeps customers safe, and the channel knows exactly why.",
          lesson:
            "Mitigated means you bought time. Spending some of it on review is what the time was for.",
        },
        {
          id: "freeze-everything",
          label: "Freeze all deploys and go quiet until tomorrow",
          description:
            "Stop every deploy, leave the mitigation in place, and sort it all out in the morning.",
          impact: { risk: -10, trust: -15, speed: -10 },
          nextStepId: "the-comms",
          flags: [FLAGS.blockedRelease],
          consequence:
            "Nothing ships, nobody is told for how long, and the mitigated-but-degraded state quietly becomes the default.",
          lesson:
            "A freeze with no end date and no note is an outage you chose. The caution can be right and the silence still wrong.",
        },
      ],
    },
    {
      id: "the-comms",
      time: "4:30 PM",
      title: "The wrap-up",
      narrative:
        "Checkout is healthy. The payments team wants to know what happened. Your manager wants a one-line status. Your feature branch is still sitting there, half done.",
      context:
        "The incident is technically over. What is left is whether the next one goes better, and that is decided entirely by what you write down now.",
      options: [
        {
          id: "write-timeline",
          strong: true,
          label: "Write the incident timeline and follow-ups now",
          description:
            "Capture what happened, what fixed it, and the open items while the detail is still fresh.",
          impact: { trust: 5, quality: 5, risk: -5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "A short, honest timeline with three follow-ups. The next person who gets this page starts where you finished.",
          lesson:
            "The postmortem is the only part of an incident that compounds. Everything else just returns the system to where it was this morning.",
        },
        {
          id: "blameless-note",
          strong: true,
          label: "Send a blameless note naming the cause, not a culprit",
          description:
            "Credit the mitigation, name the shared library as the cause, and hand the upgrade off with context.",
          impact: { trust: 5, quality: 5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "The payments team relaxes, and the library owner picks up the upgrade already knowing why it matters.",
          lesson:
            "Naming a cause without naming a culprit is how teams stay willing to deploy. Blame buys nothing and costs the next deploy.",
        },
        {
          id: "quick-status-only",
          label: "Send the one-line status and call it done",
          description:
            "Resolved at 4:30, cause identified. That is all anyone needs in writing.",
          impact: { speed: 5 },
          nextStepId: END_STEP_ID,
          consequence:
            "The status goes out. The lessons stay in your head, where they cannot help the next person.",
          lesson:
            "Resolved is a status, not a memory. What you do not write down, the team gets to relive at the same price.",
        },
        {
          id: "silent-close",
          label: "Close the incident and get back to your feature",
          description:
            "It is handled. Reopen the branch and try to recover what is left of the afternoon.",
          impact: { speed: 10, trust: -10, risk: 5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.skippedValidation],
          consequence:
            "The incident closes with no notes and an unexplained rollback sitting in another team's history.",
          lesson:
            "An incident closed in silence is a lesson the next on-call has to learn again, from scratch, at the same cost you just paid.",
        },
      ],
    },
  ],
  outcomes: [
    {
      id: "safe-rollout",
      time: "4:50 PM",
      title: "Safe Rollout",
      summary:
        "The impact was contained early, the cause was proven, and the fix went out behind a flag with the error rate watched the whole way. The payments team got a straight account, the library upgrade has an owner, and the page that interrupted your afternoon is now a tidy timeline. The feature branch waits for tomorrow, which is exactly where it belongs.",
      tone: "positive",
    },
    {
      id: "minor-issue",
      time: "4:50 PM",
      title: "Minor Production Issue",
      summary:
        "Checkout recovered and the fix holds, but the recovery left loose ends: a rollback that took a while to explain, or a fix that shipped a little faster than it was verified. Nothing reached customers twice, but a cleaner hour would have left less for the next person to piece together.",
      tone: "mixed",
    },
    {
      id: "customer-incident",
      time: "4:50 PM",
      title: "Customer Impact Incident",
      summary:
        "The response chased certainty while customers kept failing, or shipped a guess into a system already on fire. The error rate spiked a second time, the rollback hit code another team had built on, and the evening turns into an incident review instead of a wrap-up. Every signal needed to avoid this was on the screen the whole time.",
      tone: "negative",
    },
    {
      id: "responsible-delay",
      time: "4:50 PM",
      title: "Responsible Delay",
      summary:
        "With the impact mitigated, the fix was held for review rather than rushed out, and everyone affected was told why and for how long. The real fix ships a little later, verified and reviewed, and the only cost is twenty minutes that the kill switch was already paying for.",
      tone: "neutral",
    },
    {
      id: "overcontrolled",
      time: "4:50 PM",
      title: "Overcontrolled Delivery",
      summary:
        "Everything froze and the channel went quiet. The mitigation may well have been enough to be safe, but nobody got to know that. The other team is left guessing, the degraded state becomes the overnight default, and tomorrow starts with an explanation that should have been one message today.",
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
          { kind: "metricAtLeast", metric: "risk", value: 58 },
          {
            kind: "allOf",
            conditions: [
              { kind: "hasFlag", flag: FLAGS.skippedValidation },
              { kind: "lacksFlag", flag: FLAGS.mitigatedImpact },
              { kind: "lacksFlag", flag: FLAGS.stagedRelease },
              { kind: "lacksFlag", flag: FLAGS.usedFeatureFlag },
              { kind: "metricAtLeast", metric: "risk", value: 43 },
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
          { kind: "metricAtMost", metric: "risk", value: 38 },
          { kind: "metricAtLeast", metric: "testConfidence", value: 55 },
          {
            kind: "anyOf",
            conditions: [
              { kind: "hasFlag", flag: FLAGS.mitigatedImpact },
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
      "The cause was on the screen the whole time, but the response ran on hunches and a quiet graph instead of evidence.",
    [FLAGS.shippedDirect]:
      "The fix went out at full volume into a system that had just proven, an hour earlier, that it could fail.",
    [FLAGS.blockedRelease]:
      "Freezing may have been safe enough, but the silence left another team guessing and the degraded state running overnight.",
  },
};
