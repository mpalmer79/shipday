import type { OutcomeId, Scenario, SimulatorState } from "./types";
import { END_STEP_ID } from "./types";
import { applyDecision, createInitialState, getCurrentStep } from "./engine";

/**
 * The exhaustive playtest walk, shared between the verify script and the
 * browser (the studio's distribution preview runs it in a web worker).
 * Nothing in this module may import anything Node-specific.
 */

export type OutcomeCounts = Partial<Record<OutcomeId, number>>;

export type Distribution = {
  /** Structural path count of the scenario. */
  pathCount: number;
  /** Runs walked: equals pathCount when exhaustive, the sample size when sampled. */
  totalRuns: number;
  counts: OutcomeCounts;
  sampled: boolean;
};

/**
 * Distinct complete runs reachable from each step, memoized by step id.
 * Purely structural (metrics and flags do not affect routing), so it stays
 * linear in the graph even where paths reconverge. Throws on a cycle, which
 * would make the count unbounded.
 */
function computePathCounts(scenario: Scenario): Map<string, number> {
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  function from(stepId: string): number {
    if (stepId === END_STEP_ID) {
      return 1;
    }
    const cached = memo.get(stepId);
    if (cached !== undefined) {
      return cached;
    }
    if (visiting.has(stepId)) {
      throw new Error(`Cycle through step "${stepId}" in ${scenario.id}`);
    }
    visiting.add(stepId);
    const step = scenario.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new Error(`Unknown step "${stepId}" in ${scenario.id}`);
    }
    let total = 0;
    for (const option of step.options) {
      total += from(option.nextStepId);
    }
    visiting.delete(stepId);
    memo.set(stepId, total);
    return total;
  }

  from(scenario.initialStepId);
  return memo;
}

export function countPaths(scenario: Scenario): number {
  if (scenario.initialStepId === END_STEP_ID) {
    return 1;
  }
  return computePathCounts(scenario).get(scenario.initialStepId) ?? 0;
}

/**
 * Walks every distinct run of the scenario and tallies outcomes. The
 * optional callback receives each completed run's final state, which is how
 * the verify script keeps its per-run assertions on this single walk
 * implementation.
 */
export function enumerateDistribution(
  scenario: Scenario,
  onRun?: (state: SimulatorState) => void
): { totalRuns: number; counts: OutcomeCounts } {
  const counts: OutcomeCounts = {};
  let totalRuns = 0;

  function walk(state: SimulatorState): void {
    if (state.completed) {
      totalRuns += 1;
      const outcomeId = state.outcomeId!;
      counts[outcomeId] = (counts[outcomeId] ?? 0) + 1;
      onRun?.(state);
      return;
    }
    const step = getCurrentStep(scenario, state);
    for (const option of step.options) {
      walk(applyDecision(scenario, state, option.id));
    }
  }

  walk(createInitialState(scenario));
  return { totalRuns, counts };
}

/** Small deterministic PRNG (mulberry32); same seed, same sequence. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Uniform random sample of complete paths, with replacement. At each step
 * the option is chosen with probability proportional to the number of
 * complete paths through it (the memoized structural counts), which makes
 * every complete path equally likely, exactly like drawing runs uniformly
 * from the exhaustive enumeration. Seeded, so the same scenario and seed
 * always produce the same tally.
 */
export function sampleDistribution(
  scenario: Scenario,
  sampleSize: number,
  seed: number
): { totalRuns: number; counts: OutcomeCounts } {
  const pathCounts = computePathCounts(scenario);
  const random = mulberry32(seed);
  const counts: OutcomeCounts = {};

  function pathsThrough(stepId: string): number {
    return stepId === END_STEP_ID ? 1 : (pathCounts.get(stepId) ?? 0);
  }

  for (let i = 0; i < sampleSize; i += 1) {
    let state = createInitialState(scenario);
    while (!state.completed) {
      const step = getCurrentStep(scenario, state);
      const total = pathsThrough(step.id);
      let pick = random() * total;
      let chosen = step.options[step.options.length - 1];
      for (const option of step.options) {
        pick -= pathsThrough(option.nextStepId);
        if (pick < 0) {
          chosen = option;
          break;
        }
      }
      state = applyDecision(scenario, state, chosen.id);
    }
    const outcomeId = state.outcomeId!;
    counts[outcomeId] = (counts[outcomeId] ?? 0) + 1;
  }

  return { totalRuns: sampleSize, counts };
}

/**
 * Preview budget. Up to the ceiling the preview walks every path and its
 * counts are exact (identical to verify's). Above it, the preview draws a
 * fixed-size seeded sample so the panel stays responsive on any draft, and
 * the result is labeled as sampled.
 */
export const PREVIEW_PATH_CEILING = 100_000;
export const PREVIEW_SAMPLE_SIZE = 20_000;
export const PREVIEW_SEED = 1;

export function previewDistribution(scenario: Scenario): Distribution {
  const pathCount = countPaths(scenario);
  if (pathCount <= PREVIEW_PATH_CEILING) {
    const { totalRuns, counts } = enumerateDistribution(scenario);
    return { pathCount, totalRuns, counts, sampled: false };
  }
  const { totalRuns, counts } = sampleDistribution(
    scenario,
    PREVIEW_SAMPLE_SIZE,
    PREVIEW_SEED
  );
  return { pathCount, totalRuns, counts, sampled: true };
}
