"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { DecisionRecord, OutcomeId, Scenario } from "@/lib/simulator";

export type CompletedRun = {
  id: string;
  scenario: Scenario;
  decisions: DecisionRecord[];
  outcomeId: OutcomeId;
  savedAt: number;
};

type RunsContextValue = {
  runs: CompletedRun[];
  addRun: (run: Omit<CompletedRun, "id" | "savedAt">) => void;
  clear: () => void;
};

const RunsContext = createContext<RunsContextValue | null>(null);

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Holds completed runs in memory for the length of the session so two of
 * them can be compared. Nothing is persisted; a reload clears it.
 */
export function CompletedRunsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [runs, setRuns] = useState<CompletedRun[]>([]);

  const addRun = useCallback(
    (run: Omit<CompletedRun, "id" | "savedAt">) => {
      setRuns((prev) => [
        ...prev,
        { ...run, id: makeId(), savedAt: Date.now() },
      ]);
    },
    []
  );

  const clear = useCallback(() => setRuns([]), []);

  const value = useMemo(
    () => ({ runs, addRun, clear }),
    [runs, addRun, clear]
  );

  return (
    <RunsContext.Provider value={value}>{children}</RunsContext.Provider>
  );
}

export function useCompletedRuns(): RunsContextValue {
  const ctx = useContext(RunsContext);
  if (!ctx) {
    throw new Error("useCompletedRuns must be used within CompletedRunsProvider");
  }
  return ctx;
}
