import type { Scenario } from "@/lib/simulator/types";
import { END_STEP_ID } from "@/lib/simulator/types";
import { FLAGS } from "./flags";

const EXPORT_SNIPPET = `function exportRow(order: Order): string[] {
  // Serializes every column in ORDER_FIELDS, for every caller.
  return ORDER_FIELDS.map((field) => formatField(order[field]));
}

// ORDER_FIELDS includes card_last_four, billing_address,
// delivery_address. There is no role check anywhere on this
// path: the same 31 columns go to an admin, a support agent,
// or the contractor who got read access last quarter.`;

export const theMissingRequirement: Scenario = {
  id: "the-missing-requirement",
  name: "The Missing Requirement",
  tagline: "Two weeks of work, approved and ready to merge. Then a stakeholder mentions the constraint nobody wrote down.",
  initialStepId: "the-remark",
  initialMetrics: {
    quality: 55,
    speed: 55,
    risk: 15,
    trust: 60,
    focus: 65,
    testConfidence: 55
  },
  steps: [
    {
      id: "the-remark",
      time: "9:00 AM",
      title: "Done, by every definition you had",
      narrative: "Standup. Your order-history export merges today for tomorrow's release train: two weeks of work, approved, QA-passed, demoed on Friday. Then Lena from enterprise success, already half out the door: \"The Hartwell addendum is covered, right? Exports mask payment and address fields for non-admin users.\"",
      context: "There is no ticket for that. It is not in the spec, the acceptance criteria, or a single review comment. Lena said it the way people mention things everyone already knows.",
      systemSignals: [
        "✓ PR #2148 order-history export: approved by 2 reviewers, 41 files",
        "✓ QA: 36 cases passed, 0 of them about role-based masking",
        "✓ release notes drafted: \"Export your full order history to CSV\"",
        "⚠️  search for \"mask\" across the spec, tickets, and review threads: 0 results"
      ],
      options: [
        {
          id: "merge-on-schedule",
          label: "Merge it; the ticket says done",
          description: "The acceptance criteria are met and the train leaves tomorrow. A hallway remark is not a requirement.",
          impact: {
            speed: 10,
            risk: 15,
            quality: -5
          },
          nextStepId: "sizing-the-gap",
          flags: [
            FLAGS.skippedValidation
          ],
          consequence: "The PR merges clean. The remark is now a thing you officially heard and officially ignored.",
          lesson: "Acceptance criteria are a contract with the ticket, not with reality. Reality does not check which one you satisfied."
        },
        {
          id: "ask-lena",
          strong: true,
          label: "Stop Lena and get the exact constraint",
          description: "Two minutes before she disappears into meetings: which fields, which roles, which customers, and where is it written?",
          impact: {
            speed: -5,
            trust: 5,
            risk: -10
          },
          nextStepId: "sizing-the-gap",
          flags: [
            FLAGS.askedClarifyingQuestions
          ],
          consequence: "Lena pulls up the addendum on her phone: payment and address fields, masked for every non-admin role, for Hartwell and two other enterprise contracts.",
          lesson: "A constraint mentioned in passing is still a constraint. The cheap moment to pin it down is while the person who knows it is in the room."
        },
        {
          id: "read-addendum",
          strong: true,
          label: "Find and read the contract addendum yourself",
          description: "Get the source, not the summary. Legal keeps signed addenda in the contract repository.",
          impact: {
            speed: -5,
            quality: 10,
            risk: -5,
            focus: -5
          },
          nextStepId: "sizing-the-gap",
          flags: [
            FLAGS.inspectedExistingCode
          ],
          consequence: "Section 7.3: exports of order data must mask payment instruments and delivery addresses for non-administrative users. Signed eight months ago, two products before yours.",
          lesson: "Requirements that live in contracts do not file their own tickets. Someone has to read the primary source, and today that is you."
        },
        {
          id: "test-the-claim",
          label: "Run the export as a non-admin and look",
          description: "Before debating the requirement, check the behavior: pull an order-history export as a support-role user.",
          impact: {
            testConfidence: 10,
            risk: -5,
            speed: -5
          },
          nextStepId: "sizing-the-gap",
          flags: [
            FLAGS.reproducedFailure
          ],
          consequence: "The CSV lands with card last-fours and street addresses, in a file any support agent can generate. The gap is real and it is on your screen.",
          lesson: "An argument about whether something is a problem ends fastest when someone produces the file."
        }
      ]
    },
    {
      id: "sizing-the-gap",
      time: "10:00 AM",
      title: "How big is it really",
      narrative: "The constraint is real. The open question is its shape: two columns to hide, or a policy the feature was never designed around? Tomas, the PM, has already asked twice whether the export is still on tomorrow's train.",
      context: "Done turned out to be a guess about scope. Before picking a fix you need to know whether you are missing an hour of work or a design.",
      options: [
        {
          id: "assume-two-columns",
          label: "Treat it as two columns to hide",
          description: "Lena named payment and address fields. Hide those two and the problem she named is gone.",
          impact: {
            speed: 10,
            risk: 15,
            quality: -10
          },
          nextStepId: "the-call",
          flags: [
            FLAGS.skippedValidation
          ],
          consequence: "You scope it as cosmetic. Nothing about roles, logging, or the two other contracts made it into that estimate.",
          lesson: "Sizing a requirement by the effort you can afford is estimation running backwards."
        },
        {
          id: "map-fields",
          strong: true,
          label: "Map every export field against the addendum",
          description: "Thirty-one columns, one contract clause. Make the table before making any claims.",
          impact: {
            speed: -5,
            quality: 10,
            risk: -10
          },
          nextStepId: "the-call",
          flags: [
            FLAGS.inspectedExistingCode
          ],
          consequence: "Eleven of 31 fields are in scope, two of them only for certain contract tiers, and the addendum also wants exports logged. It is a policy, not a column filter.",
          lesson: "The size of a requirement is a property of the requirement. You find it by enumeration, not negotiation."
        },
        {
          id: "ask-which-customers",
          label: "Ask which contracts carry the clause",
          description: "One addendum was mentioned. Ask Lena and the sales channel how many contracts actually have it.",
          impact: {
            trust: 5,
            speed: -5,
            risk: -5
          },
          nextStepId: "the-call",
          flags: [
            FLAGS.askedClarifyingQuestions
          ],
          consequence: "Three signed contracts carry the clause today and sales is mid-deal on a fourth. This is not a Hartwell quirk; it is the enterprise default now.",
          lesson: "One stakeholder's remark is often a population, not an anecdote. Ask how many before deciding how much."
        },
        {
          id: "write-acceptance",
          strong: true,
          label: "Write the missing requirement down before touching code",
          description: "Fields, roles, contracts, logging: put the constraint in the ticket as acceptance criteria, visible to everyone who reviewed the old definition.",
          impact: {
            quality: 5,
            risk: -5,
            speed: -5
          },
          nextStepId: "the-call",
          flags: [
            FLAGS.communicatedTradeoffs
          ],
          consequence: "Four sentences in the ticket. For the first time today, done has a written definition.",
          lesson: "A requirement is not discovered until it is written where the next person will look. Until then it is folklore."
        }
      ]
    },
    {
      id: "the-call",
      time: "11:30 AM",
      title: "Reopen, patch, or renegotiate",
      narrative: "Tomas gets you on a call: \"Give it to me straight. Can the export still make the train?\" The honest answer starts with the word depends, and what you propose in the next ten minutes decides the shape of the afternoon.",
      context: "Three real strategies exist: reopen the work and do it right, ship something smaller that is safe by construction, or renegotiate what tomorrow's train carries. Pretending it ships as built is also, technically, on the table.",
      codeSnippet: EXPORT_SNIPPET,
      options: [
        {
          id: "ship-and-patch",
          label: "Propose shipping as built, patching next sprint",
          description: "The train is tomorrow, the audit is someday. Ship, then fix masking as fast follow.",
          impact: {
            speed: 10,
            risk: 15,
            trust: -5
          },
          nextStepId: "renegotiate-scope",
          flags: [
            FLAGS.skippedValidation
          ],
          consequence: "Tomas likes the sound of on time. You have proposed shipping a known contract violation with a promise stapled to it.",
          consequenceOverrides: [
            {
              when: {
                kind: "hasFlag",
                flag: FLAGS.reproducedFailure
              },
              text: "Tomas likes the sound of on time. The CSV with the card numbers in it is still open on your screen while you propose it."
            }
          ],
          lesson: "A patch promised for after the ship date competes with everything next sprint holds. The contract does not wait in a backlog."
        },
        {
          id: "propose-descope",
          strong: true,
          label: "Propose cutting the sensitive fields from v1",
          description: "An export with no payment or address columns at all: smaller than promised, safe by construction, shippable tomorrow.",
          impact: {
            quality: 5,
            risk: -10,
            speed: -5
          },
          nextStepId: "renegotiate-scope",
          flags: [
            FLAGS.communicatedTradeoffs
          ],
          consequence: "A v1 that cannot violate the addendum because the fields are simply not there. The masking becomes v2 with a design instead of a deadline.",
          lesson: "When the date is fixed and the requirement is real, scope is the only honest variable left."
        },
        {
          id: "reopen-properly",
          strong: true,
          label: "Reopen the work: role-aware masking, done right",
          description: "Tell Tomas the export misses the train unless the masking is in. Then go build the masking.",
          impact: {
            speed: -10,
            quality: 10,
            risk: -10
          },
          nextStepId: "reopen-the-work",
          consequence: "The feature goes back on the bench it left on Friday. Done was the wrong claim, and you have just said so out loud.",
          lesson: "Reopening finished work feels like failure and is usually just accuracy. The claim was wrong, not the goal."
        },
        {
          id: "quiet-quick-filter",
          label: "Quietly patch the two named fields and say nothing",
          description: "Hide what Lena mentioned, keep the merge on schedule, and skip the awkward conversation entirely.",
          impact: {
            speed: 10,
            risk: 10,
            quality: -10,
            testConfidence: -5
          },
          nextStepId: "reopen-the-work",
          flags: [
            FLAGS.skippedValidation
          ],
          consequence: "You start an unticketed patch that hides the two fields Lena happened to name, for the roles you guessed she meant.",
          lesson: "A silent fix scoped by a hallway memory is how missing requirements reproduce."
        }
      ]
    },
    {
      id: "renegotiate-scope",
      time: "1:00 PM",
      title: "The renegotiation",
      narrative: "Tomas pulls in Lena and the Hartwell account manager for twenty minutes. Your proposal is on the table, and everyone is looking at you for the engineering half of the answer.",
      context: "Scope, date, or risk: one of them has to give. The job in this room is to make the options and their costs visible to the people who own them.",
      options: [
        {
          id: "offer-flagged-v1",
          strong: true,
          label: "Offer the export dark, behind a flag, admins first",
          description: "Ship the code on the train with the export off for non-admins until masking lands. The date survives and the contracts are never exposed.",
          impact: {
            risk: -10,
            quality: 5,
            speed: -5
          },
          nextStepId: "merge-window",
          flags: [
            FLAGS.usedFeatureFlag
          ],
          consequence: "The room takes it: the train is made, admins get the feature, and the masking work loses its deadline panic without losing its priority.",
          lesson: "A flag can split a deadline from a risk. That split is often the whole negotiation."
        },
        {
          id: "date-with-reason",
          label: "Offer a new date with the reason in writing",
          description: "Monday, with masking verified, stated plainly to all three contract owners. No train tomorrow.",
          impact: {
            speed: -10,
            risk: -10,
            trust: 5
          },
          nextStepId: "merge-window",
          flags: [
            FLAGS.communicatedTradeoffs
          ],
          consequence: "Tomas hates it and respects it in the same breath. The date moves; the reason travels with it.",
          lesson: "A date you can defend beats a date you can hit. The difference is the reason attached to it."
        },
        {
          id: "let-sales-decide",
          label: "Ask the account manager what Hartwell would accept",
          description: "The constraint is theirs. Before engineering invents a compromise, ask what the customer's compliance team actually tolerates.",
          impact: {
            trust: 5,
            risk: -5,
            speed: -5
          },
          nextStepId: "merge-window",
          flags: [
            FLAGS.askedClarifyingQuestions
          ],
          consequence: "The answer is blunt: Hartwell audits exports quarterly and a violation is findable. Nobody in the room wants to ship it as built anymore.",
          lesson: "The owner of a constraint also owns its tolerances. Asking them beats modeling them."
        },
        {
          id: "cave-to-train",
          label: "Agree to make the train with whatever is ready",
          description: "The room wants a yes. Give it one and figure the rest out tonight.",
          impact: {
            speed: 10,
            risk: 15,
            focus: -5
          },
          nextStepId: "merge-window",
          flags: [
            FLAGS.shippedDirect
          ],
          consequence: "You say yes to tomorrow with the masking question still open. The room relaxes; the export does not change.",
          lesson: "Agreement is not progress when the thing agreed to is still broken. The room's relief is borrowed, with interest."
        }
      ]
    },
    {
      id: "reopen-the-work",
      time: "1:00 PM",
      title: "The rework",
      narrative: "The branch reopens. The serializer needs a field policy, the policy needs role context, and the tests need to encode all of it before the word done gets used a second time.",
      context: "Rework under deadline is where corners get invented. The afternoon is short, and the difference between a policy and a patch is exactly the part that takes time.",
      options: [
        {
          id: "field-policy-tests",
          strong: true,
          label: "Build the field policy with tests per role",
          description: "A masking table, a role check at the one choke point, and a test for every role-field pair the addendum names.",
          impact: {
            speed: -10,
            quality: 15,
            testConfidence: 15,
            risk: -10
          },
          nextStepId: "merge-window",
          flags: [
            FLAGS.investigatedTest
          ],
          consequence: "Slow, and then suddenly solid: the suite now fails if a masked field ever leaks again, for any role, in any export.",
          lesson: "The test you write for a missed requirement is the only thing that stops it from being missed twice."
        },
        {
          id: "mask-two-columns",
          label: "Hard-code masks for the two named fields",
          description: "card_last_four and delivery_address go dark for everyone. Fast, visible, done by lunch.",
          impact: {
            speed: 10,
            risk: 10,
            testConfidence: -10
          },
          nextStepId: "merge-window",
          flags: [
            FLAGS.skippedValidation
          ],
          consequence: "Two columns go dark. The addendum named categories, not columns, and the other nine in-scope fields keep flowing.",
          consequenceOverrides: [
            {
              when: {
                kind: "hasFlag",
                flag: FLAGS.inspectedExistingCode
              },
              text: "Two columns go dark. Your own reading of the addendum says eleven fields are in scope; the patch closes the two that came up in conversation."
            }
          ],
          lesson: "Patching the example instead of the rule satisfies the conversation, not the constraint."
        },
        {
          id: "disable-non-admin",
          strong: true,
          label: "Gate the whole export to admins for now",
          description: "One conditional: non-admin roles lose the export button until masking exists. Blunt and impossible to leak through.",
          impact: {
            risk: -15,
            speed: 5,
            trust: -5
          },
          nextStepId: "merge-window",
          flags: [
            FLAGS.mitigatedImpact
          ],
          consequence: "Non-admins lose the button until masking lands. Support will grumble; the addendum cannot be violated by a button that is not there.",
          lesson: "When you cannot yet do it right, doing visibly less beats doing it almost."
        },
        {
          id: "borrow-reviewer",
          label: "Pull Friday's reviewer back in for the rework",
          description: "The person who approved the old done should see the new scope before round two.",
          impact: {
            quality: 5,
            trust: 5,
            speed: -5
          },
          nextStepId: "merge-window",
          consequence: "The reviewer walks the new scope with you and catches a tier rule you had missed. Two people now know what the export actually promises.",
          lesson: "The person who approved the old definition of done is the right witness for the new one."
        }
      ]
    },
    {
      id: "merge-window",
      time: "2:30 PM",
      title: "The window",
      narrative: "Merge cutoff for tomorrow's train is 4:30 PM. Whatever the export is now (descoped, gated, patched, or untouched) the merge decision is back, and this time the remark is in the room with it.",
      context: "Same button as this morning. Different day. The question is no longer whether the ticket says done; it is whether you can say it.",
      systemSignals: [
        "release train departs 7:00 AM tomorrow; merge cutoff 4:30 PM today",
        "⚠️  Hartwell quarterly export audit: scheduled within 30 days",
        "chat: Tomas: \"whatever we ship, the release notes need to match it by 5\""
      ],
      options: [
        {
          id: "merge-with-notes",
          strong: true,
          label: "Merge, and rewrite the release notes to match reality",
          description: "The notes still promise a full export. Make them describe the product, then merge what the product actually is.",
          impact: {
            quality: 5,
            trust: 5,
            speed: 5
          },
          nextStepId: "release-call",
          flags: [
            FLAGS.communicatedTradeoffs
          ],
          consequence: "The notes now say exactly what the export includes and for whom. Support learns the limits before customers test them.",
          lesson: "Release notes are the requirement's last checkpoint. What you write there is what you actually shipped."
        },
        {
          id: "merge-quiet",
          label: "Merge and leave the notes as drafted",
          description: "The notes are already approved and the window is closing. Ship the words with the code.",
          impact: {
            speed: 10,
            risk: 10,
            trust: -5
          },
          nextStepId: "release-call",
          flags: [
            FLAGS.skippedValidation
          ],
          consequence: "The notes still promise a full order-history export. Whatever the code does now, the promise is the original one.",
          consequenceOverrides: [
            {
              when: {
                kind: "hasFlag",
                flag: FLAGS.inspectedExistingCode
              },
              text: "The notes still promise a full export. You are one of the few people who has read exactly what that promise violates, which makes the silence a choice."
            }
          ],
          lesson: "Documentation that describes the plan instead of the product turns every gap into a support ticket."
        },
        {
          id: "split-the-pr",
          strong: true,
          label: "Split the PR: finished core now, sensitive work separate",
          description: "Merge the export without the contested fields as one clean PR; the masking lands as its own reviewed change.",
          impact: {
            quality: 5,
            risk: -10,
            speed: -5,
            testConfidence: 5
          },
          nextStepId: "release-call",
          consequence: "Two PRs: the safe core makes the cutoff, and the sensitive half gets its own review instead of riding along.",
          lesson: "When part of the work is sure and part is not, splitting the merge keeps the doubt from shipping."
        },
        {
          id: "one-more-pass",
          label: "Run the role matrix once more before the cutoff",
          description: "Support, finance, contractor, admin: export as each, read each file, then decide.",
          impact: {
            testConfidence: 10,
            speed: -5,
            focus: -5
          },
          nextStepId: "release-call",
          flags: [
            FLAGS.reproducedFailure
          ],
          consequence: "Four roles, four files, read line by line. Twenty minutes well spent, says the part of you that remembers 9:30.",
          lesson: "Verification done before the cutoff is engineering. The same check after the cutoff is incident response."
        }
      ]
    },
    {
      id: "release-call",
      time: "4:00 PM",
      title: "What done means now",
      narrative: "Last call. Tomas wants one sentence for the train manifest, Lena wants one for the contract owners, and tomorrow morning will not wait for either.",
      context: "You know exactly what the export does, which contracts care, and what was verified. The final decision is the usual one: how much of this reaches users tomorrow, and who hears it from you tonight.",
      options: [
        {
          id: "full-send",
          label: "Ship the export to everyone on the train",
          description: "Whatever state the day produced, it goes out at full width tomorrow.",
          impact: {
            speed: 10,
            risk: 15
          },
          nextStepId: END_STEP_ID,
          flags: [
            FLAGS.shippedDirect
          ],
          consequence: "Every role on every contract gets tomorrow's export, in whatever state today left it.",
          consequenceOverrides: [
            {
              when: {
                kind: "hasFlag",
                flag: FLAGS.mitigatedImpact
              },
              text: "The train carries the export at full width, and the admin gate you built this afternoon is the only thing between the file and every non-admin role. It had better hold."
            }
          ],
          lesson: "Shipping at full width declares the unknowns gone. Today documented exactly which ones are not."
        },
        {
          id: "flag-and-verify",
          strong: true,
          label: "Ship behind the flag, enable per contract after checks",
          description: "The export rides the train dark and turns on contract by contract as each masking check passes.",
          impact: {
            risk: -10,
            quality: 5,
            trust: 5
          },
          nextStepId: END_STEP_ID,
          flags: [
            FLAGS.usedFeatureFlag,
            FLAGS.stagedRelease
          ],
          consequence: "The code ships, nothing is exposed, and each enablement is a check that just passed. Hartwell goes last, on purpose.",
          lesson: "Rolling out by contract turns a legal constraint into a checklist. Every enablement is a promise you just verified."
        },
        {
          id: "hold-and-write",
          strong: true,
          label: "Hold it off the train and send the write-up tonight",
          description: "No export tomorrow. Tomas, Lena, and the contract owners get the same short note: what was found, what it needs, when it lands.",
          impact: {
            speed: -10,
            risk: -15,
            trust: 5
          },
          nextStepId: END_STEP_ID,
          flags: [
            FLAGS.delayedRelease,
            FLAGS.communicatedTradeoffs
          ],
          consequence: "The train leaves without the export, and everyone who cares knows why, from you, tonight.",
          consequenceOverrides: [
            {
              when: {
                kind: "hasFlag",
                flag: FLAGS.communicatedTradeoffs
              },
              text: "The note takes ten minutes because you have been writing it all day: the field map, the new acceptance criteria, the date. Nobody reading it is surprised, which is the point."
            }
          ],
          lesson: "A miss explained tonight is a plan. The same miss discovered next week is a breach of trust on top of a breach of scope."
        },
        {
          id: "pull-it-quietly",
          label: "Pull it from the train and let the ticket go stale",
          description: "No export, no note. The manifest can speak for itself in the morning.",
          impact: {
            speed: -10,
            trust: -15,
            risk: -10
          },
          nextStepId: END_STEP_ID,
          flags: [
            FLAGS.blockedRelease
          ],
          consequence: "The export vanishes from the manifest. Sales finds out from the release notes diff, Lena from a customer, and Tomas from neither.",
          lesson: "Quietly not shipping is the one move that loses the work, the credit, and the trust at the same time."
        }
      ]
    }
  ],
  outcomes: [
    {
      id: "safe-rollout",
      time: "4:30 PM",
      title: "Safe Rollout",
      summary: "The export ships in a shape that cannot violate the addendum: masked, gated, or scoped down, verified by role, and rolled out with a way back. The contract owners hear what changed before any customer does. Done now means the same thing in the ticket, the code, and the contract, which is what it was supposed to mean two weeks ago.",
      tone: "positive"
    },
    {
      id: "minor-issue",
      time: "4:30 PM",
      title: "Minor Production Issue",
      summary: "The export goes out mostly correct. An overlooked field surfaces in the first week, caught by a support agent rather than an auditor, and is patched quietly. Close, but close was never the standard the contract set, and someone else spent a morning proving the gap was small.",
      tone: "mixed"
    },
    {
      id: "customer-incident",
      time: "4:30 PM",
      title: "Customer Impact Incident",
      summary: "An unmasked export lands where the addendum says it never should. The customer's compliance team finds it before yours does, the export is pulled mid-quarter, and the postmortem's most-used word is not a function name, it is done. Every fact needed to prevent this was known by 10:00 AM.",
      tone: "negative"
    },
    {
      id: "responsible-delay",
      time: "4:30 PM",
      title: "Responsible Delay",
      summary: "The export misses the train on purpose, in writing. The masking lands verified a few days later, the contract owners knew before the manifest changed, and the only casualty is a release note. Late and correct beat on time and exposed, and everyone affected got to agree to that in advance.",
      tone: "neutral"
    },
    {
      id: "overcontrolled",
      time: "4:30 PM",
      title: "Overcontrolled Delivery",
      summary: "The export just quietly is not there. No note, no date, no owner for the masking work. The caution itself was probably right; the silence around it spends trust the feature had already earned, and sales spends next week renegotiating around a hole nobody explained.",
      tone: "negative"
    }
  ],
  outcomeRules: [
    {
      outcomeId: "customer-incident",
      priority: 1,
      when: {
        kind: "allOf",
        conditions: [
          {
            kind: "lacksFlag",
            flag: FLAGS.delayedRelease
          },
          {
            kind: "lacksFlag",
            flag: FLAGS.blockedRelease
          },
          {
            kind: "anyOf",
            conditions: [
              {
                kind: "metricAtLeast",
                metric: "risk",
                value: 75
              },
              {
                kind: "allOf",
                conditions: [
                  {
                    kind: "hasFlag",
                    flag: FLAGS.shippedDirect
                  },
                  {
                    kind: "hasFlag",
                    flag: FLAGS.skippedValidation
                  },
                  {
                    kind: "lacksFlag",
                    flag: FLAGS.mitigatedImpact
                  },
                  {
                    kind: "lacksFlag",
                    flag: FLAGS.usedFeatureFlag
                  },
                  {
                    kind: "lacksFlag",
                    flag: FLAGS.stagedRelease
                  },
                  {
                    kind: "metricAtLeast",
                    metric: "risk",
                    value: 35
                  }
                ]
              }
            ]
          }
        ]
      }
    },
    {
      outcomeId: "overcontrolled",
      priority: 2,
      when: {
        kind: "allOf",
        conditions: [
          {
            kind: "hasFlag",
            flag: FLAGS.blockedRelease
          },
          {
            kind: "lacksFlag",
            flag: FLAGS.communicatedTradeoffs
          },
          {
            kind: "metricAtMost",
            metric: "trust",
            value: 50
          }
        ]
      }
    },
    {
      outcomeId: "responsible-delay",
      priority: 3,
      when: {
        kind: "allOf",
        conditions: [
          {
            kind: "hasFlag",
            flag: FLAGS.delayedRelease
          },
          {
            kind: "hasFlag",
            flag: FLAGS.communicatedTradeoffs
          }
        ]
      }
    },
    {
      outcomeId: "safe-rollout",
      priority: 4,
      when: {
        kind: "allOf",
        conditions: [
          {
            kind: "metricAtMost",
            metric: "risk",
            value: 28
          },
          {
            kind: "metricAtLeast",
            metric: "testConfidence",
            value: 60
          },
          {
            kind: "anyOf",
            conditions: [
              {
                kind: "hasFlag",
                flag: FLAGS.usedFeatureFlag
              },
              {
                kind: "hasFlag",
                flag: FLAGS.stagedRelease
              },
              {
                kind: "hasFlag",
                flag: FLAGS.mitigatedImpact
              }
            ]
          }
        ]
      }
    }
  ],
  fallbackOutcomeId: "minor-issue",
  missedSignals: {
    [FLAGS.skippedValidation]: "The constraint surfaced at 9:30 in a hallway sentence, and parts of the day still ran on the ticket's definition of done instead of the contract's.",
    [FLAGS.shippedDirect]: "The export went wide while the masking question was still open, so the first audit of the gap will be a customer's, not yours.",
    [FLAGS.blockedRelease]: "Pulling the export may have been right, but sales, success, and the PM each found out from somewhere that was not you."
  }
};
