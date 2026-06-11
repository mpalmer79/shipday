import type { Scenario } from "@/lib/simulator/types";
import { END_STEP_ID } from "@/lib/simulator/types";
import { FLAGS } from "./flags";

const CONFIG_DIFF_SNIPPET = `# customer-prod.yaml
 retry:
-  timeout: 30
+  timeout: 90
   max_attempts: 3

# Two-line diff. Three consumers.
# checkout-api parses this as seconds: 90s, what the customer asked for.
# notif-daemon passes it straight into a millisecond API: a 90ms
# timeout, which would make every notification retry instantly.`;

export const fridayDeploy: Scenario = {
  id: "friday-deploy",
  name: "Friday Deploy",
  tagline: "A two-line config change, a 5:00 PM window, and half the team gone.",
  initialStepId: "trivial-ticket",
  initialMetrics: {
    quality: 50,
    speed: 55,
    risk: 25,
    trust: 60,
    focus: 55,
    testConfidence: 45,
  },
  steps: [
    {
      id: "trivial-ticket",
      time: "2:00 PM",
      title: "The trivial ticket",
      narrative:
        "Marcus (customer success): \"Big customer keeps hitting retry timeouts during their batch runs. Can we raise retry_timeout from 30 to 90? They asked for it before their Monday run. Two-line change, right?\"",
      context:
        "It is Friday. The deploy window closes at 5:00 PM, half the team is already out, and on-call hands off to Riya at 6:00 PM. The change really is two lines.",
      options: [
        {
          id: "edit-and-deploy",
          label: "Edit the value and open the deploy",
          description:
            "It is one number in one file. Change it, deploy it, make the customer happy before the weekend.",
          impact: { speed: 10, risk: 10, quality: -5 },
          nextStepId: "the-fanout",
          flags: [FLAGS.skippedValidation],
          consequence:
            "The PR is up in four minutes. You have not yet checked who else reads that number.",
          lesson:
            "The size of a diff says nothing about the size of its effect. Config changes skip the compiler, the tests, and usually the review.",
        },
        {
          id: "find-consumers",
          strong: true,
          label: "Find everything that reads the value",
          description:
            "Search the codebase for retry_timeout before touching it. Config keys have a habit of being shared.",
          impact: { speed: -5, quality: 10, risk: -10 },
          nextStepId: "the-fanout",
          flags: [FLAGS.inspectedExistingCode],
          consequence:
            "Three services read the key. You only knew about one of them.",
          lesson:
            "A config key is an unversioned API. Before changing one, find every consumer, because nothing else will check for you.",
        },
        {
          id: "ask-what-problem",
          strong: true,
          label: "Ask what problem the customer is actually having",
          description:
            "Timeouts during batch runs could be the timeout value, or it could be something the timeout is hiding. Ask Marcus for the error messages.",
          impact: { trust: 5, speed: -5, risk: -5 },
          nextStepId: "the-fanout",
          flags: [FLAGS.askedClarifyingQuestions],
          consequence:
            "The errors show retries hitting a rate limit. A longer timeout helps, but the requested number came from a guess.",
          lesson:
            "Customers ask for the fix they can name, not the problem they have. Look at the evidence before implementing the request verbatim.",
        },
        {
          id: "check-the-clock",
          label: "Check the window, the calendar, and on-call",
          description:
            "Before deciding anything, get the constraints straight: who is around, who carries the pager tonight, and what the window allows.",
          impact: { focus: 5, risk: -5, speed: -5 },
          nextStepId: "the-fanout",
          consequence:
            "Window closes 5:00 PM. Riya takes the pager at 6:00 PM and was not involved in this change. That is your real deadline math.",
          lesson:
            "A deploy decision includes who will be holding it at 2:00 AM. Know the on-call situation before you know your answer.",
        },
      ],
    },
    {
      id: "the-fanout",
      time: "2:30 PM",
      title: "The fan-out",
      narrative:
        "The search results come back. retry_timeout is read by checkout-api, billing-worker, and notif-daemon. Two of those belong to other teams, and one of those teams is fully out today.",
      context:
        "What looked like one service's setting is shared state across three. The customer's request only mentioned checkout.",
      systemSignals: [
        "checkout-api/config.ts: retryTimeout = config.get('retry_timeout')  // seconds",
        "billing-worker/settings.py: RETRY_TIMEOUT = cfg['retry_timeout'] * 1000  # converts to ms",
        "notif-daemon/main.go: client.Timeout = cfg.RetryTimeout  // passed to a ms-based API",
        "⚠️  3 consumers across 2 teams; notif-daemon owners are out today",
      ],
      options: [
        {
          id: "proceed-anyway",
          label: "Proceed with the global change",
          description:
            "Three consumers, one number, and the customer asked for 90. Ship the value they requested.",
          impact: { speed: 10, risk: 15, quality: -5 },
          nextStepId: "the-diff",
          flags: [FLAGS.skippedValidation],
          consequence:
            "The change stays global. Whatever notif-daemon does with 90, it does it for everyone.",
          lesson:
            "Shared config means shared blast radius. A change scoped to everyone needs evidence scoped to everyone.",
        },
        {
          id: "map-blast-radius",
          strong: true,
          label: "Trace what each consumer does with the value",
          description:
            "Read all three call sites properly. Units, defaults, retry loops: know exactly what 90 means to each service.",
          impact: { speed: -10, quality: 10, risk: -10 },
          nextStepId: "the-diff",
          flags: [FLAGS.inspectedExistingCode],
          consequence:
            "checkout-api wants seconds, billing-worker converts correctly, and notif-daemon feeds the raw value to a millisecond API. One of three would break.",
          lesson:
            "Blast radius is not how many services read a value. It is what each one does with it. Only reading the call sites tells you that.",
        },
        {
          id: "ask-owning-team",
          label: "Ask the other teams before touching their input",
          description:
            "Billing's channel is half awake and notif-daemon's owners are out. Post the proposed change and ask for objections by 3:30 PM.",
          impact: { trust: 5, risk: -10, speed: -5 },
          nextStepId: "the-diff",
          flags: [FLAGS.askedClarifyingQuestions],
          consequence:
            "Billing replies \"fine by us.\" Silence from notif-daemon, which is not the same thing as consent.",
          lesson:
            "Changing another team's inputs without telling them converts your deploy into their incident. Silence is not a review.",
        },
        {
          id: "scope-to-tenant",
          strong: true,
          label: "Scope the change to the requesting customer",
          description:
            "Make the override tenant-specific instead of global. The customer gets 90, everyone else keeps 30.",
          impact: { quality: 5, risk: -10, speed: -5 },
          nextStepId: "the-diff",
          consequence:
            "The override file supports per-tenant values. The blast radius just shrank from everyone to one customer who asked for this.",
          lesson:
            "When a global change and a scoped change solve the same problem, the scoped one is almost always the right first move.",
        },
      ],
    },
    {
      id: "the-diff",
      time: "3:00 PM",
      title: "The two-line diff",
      narrative:
        "Here is the whole change. Two lines in a YAML file. The kind of diff that gets approved from a phone in an elevator.",
      context:
        "Config changes carry none of the safety rails code gets: no types, no tests, no compiler. The diff is small because all the danger lives in the consumers.",
      codeSnippet: CONFIG_DIFF_SNIPPET,
      options: [
        {
          id: "trust-the-diff",
          label: "Approve it as written",
          description:
            "Two lines, requested by the customer, reviewed by you twice. It does not get simpler than this.",
          impact: { speed: 10, risk: 15, testConfidence: -5 },
          nextStepId: "nobody-to-review",
          flags: [FLAGS.skippedValidation],
          consequence:
            "Approved. The notif-daemon question is still open; the diff does not answer it, and neither did you.",
          lesson:
            "Reviewing the diff is not the same as reviewing the change. The diff shows what moves; the consumers decide what breaks.",
        },
        {
          id: "staging-dry-run",
          strong: true,
          label: "Apply it in staging and watch all three services",
          description:
            "Push the value to staging and watch each consumer's logs and retry behavior for half an hour.",
          impact: { speed: -5, testConfidence: 15, risk: -10 },
          nextStepId: "nobody-to-review",
          consequence:
            "Staging tells the truth: checkout-api behaves, billing-worker behaves, and notif-daemon starts retrying every 90 milliseconds.",
          lesson:
            "For changes with no test coverage, a staging dry run is the test. Watch every consumer, not just the one in the ticket.",
        },
        {
          id: "write-rollback-plan",
          strong: true,
          label: "Write the rollback before the deploy",
          description:
            "Exact revert steps, how long they take, what to watch, and who can run them if you are unreachable. On the wiki before the deploy exists.",
          impact: { risk: -15, quality: 5, speed: -5 },
          nextStepId: "nobody-to-review",
          flags: [FLAGS.preparedRollback],
          consequence:
            "The revert is two commands and four minutes, and now Riya can run it without calling you. Friday just got less expensive.",
          lesson:
            "A rollback plan written before the deploy is engineering. The same plan improvised during an incident is luck.",
        },
        {
          id: "verify-units",
          strong: true,
          label: "Verify the units in every consumer",
          description:
            "Read the three call sites and confirm what unit each one actually expects before changing the number they share.",
          impact: { quality: 10, risk: -10, testConfidence: 5 },
          nextStepId: "nobody-to-review",
          flags: [FLAGS.inspectedExistingCode],
          consequence:
            "Confirmed: notif-daemon treats the value as milliseconds. The customer's fix would have set notification timeouts to 90ms globally.",
          lesson:
            "Unit mismatches are the classic shared-config failure. The number is never just a number; it is a number in somebody's unit.",
        },
      ],
    },
    {
      id: "nobody-to-review",
      time: "3:30 PM",
      title: "Nobody to review it",
      narrative:
        "The PR needs a second pair of eyes. Your usual reviewers' statuses read: out, out, parental leave, and \"back Monday.\" The window closes in 90 minutes.",
      context:
        "Review exists to catch what the author cannot see. On a Friday afternoon, the question is what substitutes for it, not whether to skip it.",
      options: [
        {
          id: "self-merge",
          label: "Self-approve and merge",
          description:
            "You have read this diff more times than anyone ever will. The review requirement is a formality today.",
          impact: { speed: 10, risk: 10, trust: -5 },
          nextStepId: "window-pressure",
          flags: [FLAGS.skippedValidation],
          consequence:
            "Merged. The one mechanism designed to catch your blind spots was the one you waived.",
          lesson:
            "Review is for the mistakes the author cannot see, which is exactly why the author cannot waive it accurately.",
        },
        {
          id: "pull-oncall",
          strong: true,
          label: "Ask the outgoing on-call for fifteen minutes",
          description:
            "They are around until 6:00 PM and will inherit tonight either way. Walk them through the change and the consumers.",
          impact: { trust: 5, quality: 5, risk: -5, speed: -5 },
          nextStepId: "window-pressure",
          consequence:
            "They catch nothing new but now understand the change. If the pager fires tonight, the person holding it has context.",
          lesson:
            "Reviewing with the person who will be paged is two wins in one: a second reader now, an informed responder later.",
        },
        {
          id: "park-for-monday",
          label: "Park the PR for Monday review",
          description:
            "Leave the change ready, reviewed by nobody, deployed by nobody. Monday has reviewers and a full deploy window.",
          impact: { speed: -10, risk: -10, focus: 5 },
          nextStepId: "window-pressure",
          consequence:
            "The PR sits ready with your analysis attached. Monday's review takes ten minutes because the work is already done.",
          lesson:
            "Work can be finished without being shipped. Separating those two states is what makes waiting cheap.",
        },
        {
          id: "gate-behind-flag",
          strong: true,
          label: "Put the new value behind a rollout flag",
          description:
            "Wrap the override in a flag with gradual rollout, so the change ships dark and turns on in controlled steps.",
          impact: { risk: -10, quality: 5, speed: -5 },
          nextStepId: "window-pressure",
          flags: [FLAGS.usedFeatureFlag],
          consequence:
            "The deploy and the behavior change are now two separate events. Either one can happen without the other.",
          lesson:
            "A flag decouples deploying code from changing behavior. On a Friday, that decoupling is the whole game.",
        },
      ],
    },
    {
      id: "window-pressure",
      time: "4:00 PM",
      title: "The window pressure",
      narrative:
        "Marcus again: \"Customer is asking if it will be live for their weekend test run. I told them probably. The window closes at five, right?\"",
      context:
        "\"Probably\" is now a commitment with your name attached. Whatever you tell Marcus is what the customer hears, and what Riya inherits at 6:00 PM.",
      options: [
        {
          id: "promise-today",
          label: "Confirm it ships today",
          description:
            "Take the probably and make it a yes. The customer hears good news going into their weekend.",
          impact: { speed: 5, trust: 5, risk: 10 },
          nextStepId: "window-closes",
          flags: [FLAGS.shippedDirect],
          consequence:
            "Marcus relays the yes. The remaining decisions of the day now have a promise leaning on them.",
          lesson:
            "Commitments made on your behalf become real the moment you confirm them. Confirm the state of the work, not the hope.",
        },
        {
          id: "explain-friday-math",
          strong: true,
          label: "Explain what a 4:50 PM Friday deploy means",
          description:
            "Lay it out for Marcus: the on-call handoff, the empty Saturday roster, and what the customer actually risks if it goes wrong at midnight.",
          impact: { trust: 5, risk: -10, speed: -5 },
          nextStepId: "window-closes",
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "Marcus gets it: \"So the question is whether their Saturday test is worth our Saturday outage. Let me ask them.\" The decision finds its real owner.",
          lesson:
            "Stakeholders can weigh risk they can see. Translate deploy mechanics into their consequences and let the owner of the deadline decide.",
        },
        {
          id: "offer-monday",
          label: "Offer Monday 9:00 AM in writing",
          description:
            "Counter with a specific alternative: verified deploy Monday morning, before their batch run, with the reason stated plainly.",
          impact: { speed: -10, risk: -10 },
          nextStepId: "window-closes",
          flags: [FLAGS.communicatedTradeoffs],
          consequence:
            "Their batch run turns out to be Monday 2:00 PM. The weekend urgency was an assumption nobody had checked.",
          lesson:
            "Deadlines inherit urgency from whoever states them. A specific counter-offer is the cheapest way to find the real one.",
        },
        {
          id: "tenant-canary-today",
          strong: true,
          label: "Ship it today for this tenant only",
          description:
            "Split the difference: the requesting customer gets the change today, scoped to them, with their traffic as the canary.",
          impact: { risk: -10, testConfidence: 5, speed: -5 },
          nextStepId: "window-closes",
          flags: [FLAGS.stagedRelease],
          consequence:
            "One tenant, one change, one place to watch. The customer gets their weekend run and everyone else is out of the blast radius.",
          lesson:
            "The customer who wants the change is the safest place to test it. Scoping turns a global gamble into a contained experiment.",
        },
      ],
    },
    {
      id: "window-closes",
      time: "4:30 PM",
      title: "The window closes",
      narrative:
        "4:30 PM. The deploy window closes in thirty minutes, Riya takes the pager in ninety, and the change is sitting there, ready or not. Last call.",
      context:
        "Whatever ships now runs unattended through a weekend. Whatever does not ship needs a sentence telling people why. Those are the only two honest options.",
      options: [
        {
          id: "deploy-global",
          label: "Deploy the global change now",
          description:
            "Beat the window, close the ticket, give the customer their number everywhere.",
          impact: { speed: 10, risk: 15 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.shippedDirect],
          consequence:
            "The deploy lands at 4:51 PM. All three services pick up the new value heading into the quietest support hours of the week.",
          lesson:
            "A Friday evening deploy runs during the hours with the least coverage and the slowest response. The calendar is part of the risk.",
        },
        {
          id: "deploy-scoped",
          strong: true,
          label: "Deploy the scoped change and watch it through handoff",
          description:
            "Ship the tenant-scoped version, stay through the 6:00 PM handoff, and brief Riya on what to watch.",
          impact: { risk: -10, trust: 5, quality: 5 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.usedFeatureFlag, FLAGS.stagedRelease],
          consequence:
            "One tenant takes the new value into the weekend. Riya gets a two-line briefing and a rollback she can run alone.",
          lesson:
            "Shipping safely on a Friday is possible. It just costs scope control, a watch window, and an informed on-call.",
        },
        {
          id: "hold-with-note",
          strong: true,
          label: "Hold for Monday and tell everyone now",
          description:
            "Do not ship. Send Marcus, the customer, and Riya the same short note: what is ready, why it waits, when it lands.",
          impact: { speed: -10, trust: 5, risk: -15 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.delayedRelease, FLAGS.communicatedTradeoffs],
          consequence:
            "Nobody is thrilled and nobody is surprised. Monday's deploy is ten minutes of work with a weekend of context attached.",
          lesson:
            "Not shipping is an engineering decision, not the absence of one. It only counts if you write it down and own it.",
        },
        {
          id: "quiet-friday-exit",
          label: "Let the window close and head out",
          description:
            "No deploy, no note. The ticket can explain itself on Monday.",
          impact: { speed: -10, trust: -15, risk: -10 },
          nextStepId: END_STEP_ID,
          flags: [FLAGS.blockedRelease],
          consequence:
            "Saturday morning, the customer asks Marcus where the change is. Marcus asks the channel. The channel is empty.",
          lesson:
            "A hold nobody hears about reads as a dropped ball, not a decision. The note costs one minute; its absence costs the weekend.",
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
        "The change ships scoped, watched, and reversible. The requesting customer gets their fix before the weekend, the other two services never see the new value, and Riya's pager stays quiet. Friday deploys earn their bad reputation one shortcut at a time; this one took none.",
      tone: "positive",
    },
    {
      id: "minor-issue",
      time: "4:50 PM",
      title: "Minor Production Issue",
      summary:
        "The change goes out and mostly holds. One service logs a burst of odd retry behavior on Saturday; it self-recovers, but Riya spends an hour confirming that with no context on the change. The fix was right. The Friday execution left gaps someone else absorbed.",
      tone: "mixed",
    },
    {
      id: "customer-incident",
      time: "4:50 PM",
      title: "Customer Impact Incident",
      summary:
        "notif-daemon picks up the new value as milliseconds and starts retrying every notification instantly. The queue saturates Saturday morning, Riya gets paged into a change she never saw, and the rollback happens without a plan. The two-line diff did exactly what its consumers told it to.",
      tone: "negative",
    },
    {
      id: "responsible-delay",
      time: "4:50 PM",
      title: "Responsible Delay",
      summary:
        "The change waits for Monday, in writing, with the reason and the new date sent to everyone affected. The customer's run was Monday afternoon anyway. The deploy takes ten minutes with full review, and the weekend belongs to no ticket at all.",
      tone: "neutral",
    },
    {
      id: "overcontrolled",
      time: "4:50 PM",
      title: "Overcontrolled Delivery",
      summary:
        "The window closes on an unshipped change and an unsent explanation. Holding it may well have been right; nobody affected got to know that. The customer plans a weekend around a fix that is not coming, and Monday starts with an apology instead of a deploy.",
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
          { kind: "metricAtLeast", metric: "risk", value: 60 },
          {
            kind: "allOf",
            conditions: [
              { kind: "hasFlag", flag: FLAGS.shippedDirect },
              { kind: "lacksFlag", flag: FLAGS.preparedRollback },
              { kind: "metricAtLeast", metric: "risk", value: 34 },
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
          { kind: "metricAtLeast", metric: "testConfidence", value: 50 },
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
      "A shared config key feeds three services in two units, and the change shipped without anyone reading the call sites that decide what 90 means.",
    [FLAGS.shippedDirect]:
      "A global config change went out into a Friday evening, the hours with the least coverage and the slowest response, on a promise made for it.",
    [FLAGS.blockedRelease]:
      "Holding for Monday may have been right, but the customer planned a weekend around a fix that was not coming and nobody told them.",
  },
};
