"use client";

import { useSyncExternalStore } from "react";
import type { DecisionRecord, OutcomeId, Scenario } from "@/lib/simulator";

/**
 * In-memory store of completed runs for the current session. It holds only
 * what a comparison needs (the scenario and the decision trail); everything
 * else is reconstructed. Nothing is persisted: a full reload clears it.
 */

export type SavedRun = {
  runId: string;
  scenario: Scenario;
  decisions: DecisionRecord[];
  outcomeId: OutcomeId;
  outcomeTitle: string;
  savedAt: number;
};

let runs: SavedRun[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

let counter = 0;

export function addRun(run: {
  scenario: Scenario;
  decisions: DecisionRecord[];
  outcomeId: OutcomeId;
  outcomeTitle: string;
}): void {
  counter += 1;
  runs = [
    ...runs,
    {
      ...run,
      runId: `${run.scenario.id}-${counter}`,
      savedAt: Date.now(),
    },
  ];
  emit();
}

export function clearRuns(): void {
  runs = [];
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const EMPTY: SavedRun[] = [];

export function useCompletedRuns(): SavedRun[] {
  return useSyncExternalStore(
    subscribe,
    () => runs,
    () => EMPTY
  );
}
