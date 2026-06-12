import type { Scenario } from "@/lib/simulator/types";
import { END_STEP_ID } from "@/lib/simulator/types";

import { FLAGS } from "./flags";

const AI_SUGGESTION_SNIPPET = `function applyDiscount(cart: Cart, code: DiscountCode): Cart {
  const discount = code.percent
    ? cart.subtotal * (code.percent / 100)
    : code.amount;

  return {
    ...cart,
    discount,
    total: cart.subtotal - discount,
    // TODO: tax recalculation?
  };
}

// Looks reasonable. But: what happens when \`discount\`
// exceeds \`cart.subtotal\`? Nothing stops \`total\` from
// going negative. And promo codes already touch
// \`cart.discount\` elsewhere in checkout.`;

export const justAddAButton: Scenario = {
  id: "just-add-a-button",
  name: "Just Add a Button",
  tagline: "A one-line ticket. A whole day of judgment calls.",
  initialStepId: "ticket-assigned",
  initialMetrics: {
    quality: 50,
    speed: 50,
    risk: 20,
    trust: 60,
    focus: 70,
    testConfidence: 50,
  },
  steps: [
    {
      id: "ticket-assigned",
      time: "9:00 AM",
      title: "The ticket arrives",
      narrative:
        "Priya (PM): “Hey! Quick one for today: can we add an 'Apply discount' button to checkout? Marketing wants it live for the weekend promo. Should be simple, right?”",
      context:
        "The ticket is one sentence long. Checkout is the most revenue-sensitive surface in the product, and you haven't touched its pricing logic in months.",
      options: [
        {
          id: "start-coding",
          label: "Start coding immediately",
          description:
            "It's just a button. Open the editor and get moving. Momentum matters.",
          impact: { speed: 10, focus: -5, risk: 10, quality: -5 },
          nextStepId: "requirements-unclear",
          flags: [FLAGS.skippedValidation],
          consequence:
            "You're moving fast, but you're building on assumptions you haven't checked.",
          lesson:
            "Speed at the start of a task is cheap. Speed at the end, after rework, is what actually matters.",
        },
        {
          id: "ask-questions",
          strong: true,
          label: "Ask Priya clarifying questions",
          description:
            "What exactly should the discount apply to? Which users see it? What happens with existing promos?",
          impact: { speed: -5, quality: 5, trust: 5, risk: -5 },
          nextStepId: "requirements-unclear",
          flags: [FLAGS.askedClarifyingQuestions],
          consequence:
            "Priya admits she hadn't thought about promo codes. “Good catch, let me check with marketing.”",
          lesson:
            "A two-minute question this morning is cheaper than a rollback tonight.",
        },
        {
          id: "inspect-checkout",
          strong: true,
          label: "Read the existing checkout code first",
          description:
            "Spend twenty minutes understanding how pricing, promos, and totals flow before writing anything.",
          impact: { speed: -5, quality: 10, risk: -10, focus: 5 },
          nextStepId: "requirements-unclear",
          flags: [FLAGS.inspectedExistingCode],
          consequence:
            "The pricing module is touchier than expected: promo codes mutate the cart total in two places.",
          lesson:
            "Reading code you're about to change is not a delay. It is the work.",
        },
        {
          id: "find-tests",
          label: "Look for related tests",
          description:
            "Find out what the existing test suite covers around checkout and discounts before deciding how to build.",
          impact: { speed: -5, testConfidence: 10, risk: -5 },
          nextStepId: "requirements-unclear",
          flags: [FLAGS.inspectedExistingCode],
          consequence:
            "There's a pricing test suite. Older than you expected, but it covers promo interactions.",
          lesson:
            "Tests are documentation of what the system promises. Read the promises before changing them.",
        },
      ],
    },
    {
      id: "requirements-unclear",
      time: "10:00 AM",
      title: "The requirements get fuzzy",
      narrative:
        "You hit the question nobody answered: should the new discount stack with existing promo codes? The spec doesn't say. Marketing's promo starts Saturday.",
      context:
        "Stacking could double-discount carts. Not stacking could break carts that already have promos applied. There is no documented rule either way.",
      options: [
        {
          id: "assume-stacking",
          label: "Assume discounts stack",
          description:
            "It's the most permissive interpretation, and it unblocks you right now.",
          impact: { speed: 10, risk: 15, quality: -10 },
          nextStepId: "ai-suggestion",
          flags: [FLAGS.skippedValidation],
          consequence:
            "You're unblocked, on top of a guess about how money moves through the system.",
          lesson:
            "An unvalidated assumption about pricing is a financial decision someone else didn't get to make.",
        },
        {
          id: "ask-product",
          strong: true,
          label: "Ask product for a written rule",
          description:
            "Ping Priya: “Need a decision: does this stack with promo codes? One line in the ticket is fine.”",
          impact: { speed: -5, quality: 10, trust: 5, risk: -10 },
          nextStepId: "ai-suggestion",
          flags: [FLAGS.askedClarifyingQuestions],
          consequence:
            "Twenty minutes later: “No stacking. Discount wins if larger.” Now it's in writing, and it's testable.",
          lesson:
            "Getting decisions in writing isn't bureaucracy. It turns ambiguity into a requirement.",
        },
        {
          id: "check-refunds",
          label: "Check how refunds handle promos",
          description:
            "Refunds already deal with promo math. See what precedent the codebase has set.",
          impact: { quality: 10, risk: -5, focus: -5 },
          nextStepId: "ai-suggestion",
          flags: [FLAGS.inspectedExistingCode],
          consequence:
            "Refunds treat promo and discount amounts as mutually exclusive. There's your precedent.",
          lesson:
            "When the spec is silent, the codebase often already voted. Find the precedent.",
        },
        {
          id: "conservative-interpretation",
          label: "Implement the most conservative interpretation",
          description:
            "No stacking, discount capped at subtotal. Document the choice in the PR description.",
          impact: { quality: 5, risk: -5, speed: -5 },
          nextStepId: "ai-suggestion",
          consequence:
            "Safe and defensible, though product may still want different behavior once they see it.",
          lesson:
            "When you must guess, guess in the direction that loses the least money and document that you guessed.",
        },
      ],
    },
    {
      id: "ai-suggestion",
      time: "11:00 AM",
      title: "The AI offers a shortcut",
      narrative:
        "You describe the task to your coding assistant and it produces a tidy-looking implementation in seconds. It compiles. It reads cleanly. It would save you an hour.",
      context:
        "The suggestion handles the happy path well. You haven't verified what it does when the discount exceeds the subtotal, or how it interacts with the promo-code logic you know is lurking in checkout.",
      codeSnippet: AI_SUGGESTION_SNIPPET,
      options: [
        {
          id: "accept-as-is",
          label: "Accept it as-is",
          description: "It looks right, it compiles, and the clock is ticking.",
          impact: { speed: 15, risk: 20, quality: -10, testConfidence: -10 },
          nextStepId: "tests-fail",
          flags: [FLAGS.acceptedAiUnreviewed],
          consequence:
            "You just merged code you can't fully explain into the path where customers pay you.",
          consequenceOverrides: [
            {
              when: { kind: "hasFlag", flag: FLAGS.inspectedExistingCode },
              text: "You read the pricing module this morning and flagged the promo mutation as touchy. This code touches that exact path, and you merged it without checking.",
            },
          ],
          lesson:
            "AI can write the code, but it can't own the consequences. You ship it, you own it.",
        },
        {
          id: "review-line-by-line",
          strong: true,
          label: "Review it line by line",
          description:
            "Walk through every branch. Check the negative-total case. Check the promo interaction.",
          impact: { speed: -5, quality: 15, risk: -10, testConfidence: 5 },
          nextStepId: "tests-fail",
          flags: [FLAGS.reviewedAiCode],
          consequence:
            "You catch it: nothing clamps the total at zero. A 100%-off code would produce a negative charge.",
          lesson:
            "Review AI output the way you'd review a confident new hire: useful, fast, and unaware of your edge cases.",
        },
        {
          id: "ask-explanation",
          label: "Ask the AI to explain its edge cases",
          description:
            "Before accepting anything, make it walk through boundary behavior and failure modes.",
          impact: { quality: 10, risk: -5, focus: -5 },
          nextStepId: "tests-fail",
          flags: [FLAGS.reviewedAiCode],
          consequence:
            "Pressed on edge cases, it concedes the discount can exceed the subtotal. Good thing you asked.",
          lesson:
            "Interrogating generated code is a skill. The first answer is a draft, not a verdict.",
        },
        {
          id: "write-manually",
          label: "Write it yourself",
          description:
            "Skip the suggestion entirely. You know this domain; write it by hand.",
          impact: { speed: -15, quality: 10, risk: -5, focus: -10 },
          nextStepId: "tests-fail",
          consequence:
            "Slower, but every line is one you can defend. The afternoon will be tight.",
          lesson:
            "Sometimes the tool isn't wrong. It's just not worth the verification cost. Knowing when is judgment.",
        },
        {
          id: "run-tests-first",
          strong: true,
          label: "Run the existing tests against it first",
          description:
            "Don't review by eye. Let the pricing suite tell you whether this code keeps the system's promises.",
          impact: { testConfidence: 15, risk: -10, speed: -5 },
          nextStepId: "tests-fail",
          flags: [FLAGS.reviewedAiCode],
          consequence:
            "The suite lights up immediately. Whatever this code is doing, the system disagrees with it.",
          lesson:
            "An existing test suite is a free reviewer that never gets tired. Use it before you trust anything.",
        },
      ],
    },
    {
      id: "tests-fail",
      time: "1:00 PM",
      title: "A test breaks",
      narrative:
        "CI goes red. `pricing.promo_interaction` is failing: a test someone wrote two years ago, asserting that promo and discount amounts never combine on a single cart.",
      context:
        "The test is old, the author left the company, and it's the only thing standing between your change and a green build.",
      systemSignals: [
        "❌ CI: pricing.promo_interaction: FAILED (expected total 41.30, received 33.04)",
        "✓ CI: checkout.render_discount_button: passed",
        "✓ CI: cart.subtotal_calculation: passed",
        "⚠️  Last edit to failing test: 2 years ago, by a deleted account",
      ],
      options: [
        {
          id: "delete-test",
          label: "Delete the failing test",
          description:
            "It's two years old and nobody owns it. It's probably just stale.",
          impact: { speed: 10, risk: 20, testConfidence: -20, quality: -10 },
          nextStepId: "stakeholder-pressure",
          flags: [FLAGS.deletedFailingTest],
          consequence:
            "Build's green. The assertion that promos and discounts never combine is now enforced by nothing.",
          lesson:
            "A failing test is a message from a past engineer. Delete the messenger and you still have the problem.",
        },
        {
          id: "investigate-test",
          strong: true,
          label: "Investigate why the test exists",
          description:
            "Dig through git blame and the old PR. Find out what incident or decision created this assertion.",
          impact: { speed: -5, quality: 10, testConfidence: 10, risk: -10 },
          nextStepId: "stakeholder-pressure",
          flags: [FLAGS.investigatedTest],
          consequence:
            "The old PR links an incident: double-discounting cost real money in 2023. The test is a fence with a reason.",
          lesson:
            "Before removing a fence, find out why it was built. Chesterton said it first; CI just enforces it.",
        },
        {
          id: "update-test",
          strong: true,
          label: "Update the test to match the new rule",
          description:
            "The business rule changed: encode the new no-stacking behavior explicitly and keep the coverage.",
          impact: { quality: 5, testConfidence: 10, risk: -5 },
          nextStepId: "stakeholder-pressure",
          flags: [FLAGS.investigatedTest],
          consequence:
            "The suite now asserts the new behavior on purpose, instead of the old behavior by accident.",
          lesson:
            "Tests should change when requirements change: deliberately, with the new rule spelled out.",
        },
        {
          id: "push-forward",
          label: "Push forward, fix the test later",
          description:
            "Mark it skipped, file a ticket, keep moving. The deadline is real.",
          impact: { speed: 10, risk: 15, testConfidence: -10, focus: -5 },
          nextStepId: "stakeholder-pressure",
          flags: [FLAGS.skippedValidation],
          consequence:
            "The ticket goes in the backlog. You and the backlog both know how this usually ends.",
          consequenceOverrides: [
            {
              when: { kind: "hasFlag", flag: FLAGS.acceptedAiUnreviewed },
              text: "The skipped test was the only thing checking the generated code you never reviewed. Now nothing is.",
            },
          ],
          lesson:
            "“Later” is where test coverage goes to die. Skipped tests are risk wearing a polite name.",
        },
      ],
    },
    {
      id: "stakeholder-pressure",
      time: "2:30 PM",
      title: "The deadline gets loud",
      narrative:
        "Priya again, now with her manager cc'd: “Marketing locked the promo announcement for tomorrow 8 AM. We really need this live today. Where are we?”",
      context:
        "The feature works on your machine. You know exactly which corners were cut today, and nobody asking for the release does.",
      options: [
        {
          id: "ship-today",
          label: "Commit to shipping it today",
          description:
            "Say yes. It mostly works, and you can patch anything that comes up.",
          impact: { speed: 10, risk: 10, trust: 5, quality: -5 },
          nextStepId: "release-decision",
          flags: [FLAGS.shippedDirect],
          consequence:
            "Priya relaxes. You've also just promised away your safety margin.",
          lesson:
            "Saying yes feels like helping. Saying yes without stating the risk is just moving the surprise to later.",
        },
        {
          id: "feature-flag",
          strong: true,
          label: "Ship it behind a feature flag",
          description:
            "Deploy dark today, flip it on for the promo once it's verified in production.",
          impact: { risk: -10, speed: -5, trust: 5, quality: 5 },
          nextStepId: "release-decision",
          flags: [FLAGS.usedFeatureFlag],
          consequence:
            "Marketing gets their date, you get a kill switch. Everyone's deadline survives.",
          lesson:
            "A feature flag converts “ship or don't” into “ship, then decide.” That option is usually worth its cost.",
        },
        {
          id: "delay-explain",
          strong: true,
          label: "Push back with a clear explanation",
          description:
            "“It can be live tomorrow morning with the pricing edge cases verified. Today means untested money math. Your call.”",
          impact: { speed: -10, risk: -10, quality: 5 },
          nextStepId: "release-decision",
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "Tense silence, then: “Okay. Tomorrow 7 AM, and I'm telling marketing it was a quality call.”",
          lesson:
            "Stakeholders can handle bad news. What they can't handle is bad news they didn't get to plan around.",
        },
        {
          id: "internal-first",
          label: "Release to employees first",
          description:
            "Turn it on internally this afternoon. Real usage, contained blast radius, promo decision tonight.",
          impact: { risk: -10, testConfidence: 10, speed: -5 },
          nextStepId: "release-decision",
          flags: [FLAGS.stagedRelease],
          consequence:
            "Within an hour, a teammate's cart hits the promo interaction. Better them than a customer.",
          lesson:
            "Production is the only environment that tells the whole truth. Stage who hears it first.",
        },
      ],
    },
    {
      id: "release-decision",
      time: "4:00 PM",
      title: "The release call",
      narrative:
        "Everything's staged. The deploy button is right there. One more decision and the day is over, one way or another.",
      context:
        "You know today's full history: what was verified, what was guessed, what was skipped. Nobody else has that picture. The release decision is really a risk decision, and it's yours.",
      options: [
        {
          id: "full-release",
          label: "Full release to all users",
          description: "Ship it everywhere, right now. Done is done.",
          impact: { speed: 10, risk: 15 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.shippedDirect],
          consequence:
            "The deploy goes out to every cart in production at once. Whatever happens next happens to everyone.",
          consequenceOverrides: [
            {
              when: { kind: "hasFlag", flag: FLAGS.deletedFailingTest },
              text: "The deploy goes out to every cart at once, and the promo-interaction test you deleted this afternoon is no longer standing between it and a double discount.",
            },
            {
              when: { kind: "hasFlag", flag: FLAGS.usedFeatureFlag },
              text: "The flag you shipped behind this afternoon goes straight to 100 percent. The kill switch exists; you just chose not to use the dial.",
            },
          ],
          lesson:
            "A full release is a bet that you found every problem. Make sure today earned that bet.",
        },
        {
          id: "flagged-staged",
          strong: true,
          label: "Staged rollout behind the flag",
          description:
            "5% of traffic tonight, watch the dashboards, ramp to 100% before the promo.",
          impact: { risk: -10, trust: 5, quality: 5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.usedFeatureFlag, FLAGS.stagedRelease],
          consequence:
            "Five percent of carts take the new path while you watch the error rate. The blast radius is a number you chose.",
          lesson:
            "Rollout strategy is a feature. Gradual exposure turns unknown risk into observed behavior.",
        },
        {
          id: "hold-communicate",
          strong: true,
          label: "Hold the release and say why",
          description:
            "Don't ship tonight. Send a short note: what's not verified, what it could cost, when it will be ready.",
          impact: { speed: -10, trust: 5, risk: -15 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.delayedRelease, FLAGS.communicatedTradeoffs],
          consequence:
            "Nobody loves the email. Everybody knows where things stand, and the morning plan writes itself.",
          lesson:
            "A delay with a reason is a decision. A delay without one is just a missed deadline.",
        },
        {
          id: "hold-silent",
          label: "Hold the release, deal with it tomorrow",
          description:
            "Just… don't deploy. Log off. Sort out the messaging in the morning.",
          impact: { speed: -10, trust: -15, risk: -10 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.blockedRelease],
          consequence:
            "At 7:50 AM, marketing finds out the promo has no button. You weren't there for the conversation.",
          lesson:
            "Blocking a risky release can be the right call, but silence converts caution into unreliability.",
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
        "The discount button reaches users gradually, behind a flag, with the pricing edge cases verified. The dashboards stay quiet. The promo launches on time and nobody outside the team ever knows how many ways today could have gone wrong.",
      tone: "positive",
    },
    {
      id: "minor-issue",
      time: "4:30 PM",
      title: "Minor Production Issue",
      summary:
        "The release mostly works, but an unverified edge case surfaces in a handful of carts overnight. It's caught and patched by morning: a small fire, but one that a different set of choices would have prevented entirely.",
      tone: "mixed",
    },
    {
      id: "customer-incident",
      time: "4:30 PM",
      title: "Customer Impact Incident",
      summary:
        "Within hours, carts start charging customers the wrong amounts. Support tickets pile up, the deploy is rolled back at midnight, and tomorrow starts with an incident review instead of a promo. The shortcuts taken today all showed up at once, in production.",
      tone: "negative",
    },
    {
      id: "responsible-delay",
      time: "4:30 PM",
      title: "Responsible Delay",
      summary:
        "The feature doesn't ship today, and everyone knows exactly why, what it would have cost to force it, and when it lands instead. Marketing adjusts by an hour. The launch goes out clean in the morning. Slower than hoped, safer than feared.",
      tone: "neutral",
    },
    {
      id: "overcontrolled",
      time: "4:30 PM",
      title: "Overcontrolled Delivery",
      summary:
        "The release is blocked (which may even have been the right call), but nobody was told why, or when to expect it. Marketing finds out at launch time. The caution was real; the silence is what people will remember.",
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
          { kind: "metricAtLeast", metric: "risk", value: 70 },
          {
            kind: "allOf",
            conditions: [
              { kind: "hasFlag", flag: FLAGS.deletedFailingTest },
              { kind: "hasFlag", flag: FLAGS.acceptedAiUnreviewed },
              { kind: "hasFlag", flag: FLAGS.shippedDirect },
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
          { kind: "metricAtLeast", metric: "testConfidence", value: 60 },
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
      "The stacking question was answerable in one message. It got answered with a guess about how money moves through checkout instead.",
    [FLAGS.acceptedAiUnreviewed]:
      "Generated pricing code went into checkout with nobody able to say what it does when a discount exceeds the subtotal.",
    [FLAGS.deletedFailingTest]:
      "The promo-interaction test was a fence built after a real double-discounting incident. Deleting it removed the fence, not the hazard.",
    [FLAGS.shippedDirect]:
      "The discount reached every cart at once, with no flag to turn it off if the pricing math misbehaved.",
    [FLAGS.blockedRelease]:
      "Holding the release may have been right, but marketing found out the promo had no button at launch time, not from you.",
  },
};
