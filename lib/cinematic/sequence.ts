"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One stage of a cinematic sequence: a stable id and how long the stage holds
 * before the sequence advances to the next one, in milliseconds.
 */
export type SequenceStage = {
  id: string;
  /** How long this stage holds before advancing, in milliseconds. */
  hold: number;
};

export type SequenceState = {
  /** The id of the stage currently on screen. */
  stageId: string;
  /** The index of the current stage. */
  index: number;
  /** True once the sequence has run (or been skipped) to its end. */
  done: boolean;
  /** Skip straight to the final, fully legible state. */
  skip: () => void;
};

/**
 * The single sequence-orchestration primitive for the cinematic layer. It walks
 * a list of stages on real timers, then settles on the last stage and reports
 * done. Skip and reduced motion are built in, not bolted on:
 *
 *  - `skip()` clears every pending timer and jumps to the end immediately.
 *  - When `reducedMotion` is true the sequence starts already done, so the
 *    final state paints at once with no motion and no timers ever arm.
 *
 * The total run time is the sum of the stage holds, so a sequence can never run
 * longer than its authored budget. Callers gate any motion on `!done` and trust
 * this hook to land on the resting state.
 */
export function useCinematicSequence(
  stages: SequenceStage[],
  options: { reducedMotion: boolean; onDone?: () => void } = {
    reducedMotion: false,
  }
): SequenceState {
  const { reducedMotion, onDone } = options;
  const lastIndex = Math.max(stages.length - 1, 0);

  // Under reduced motion the sequence is born finished: the last stage shows
  // immediately and no timer is ever scheduled.
  const [index, setIndex] = useState(reducedMotion ? lastIndex : 0);
  const [done, setDone] = useState(reducedMotion);

  // Keep the latest onDone without re-arming the timer chain when it changes.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setIndex(lastIndex);
    setDone(true);
  }, [lastIndex]);

  useEffect(() => {
    if (reducedMotion || stages.length <= 1) {
      finish();
      return;
    }
    let elapsed = 0;
    // Schedule one timer per advance off a single elapsed clock so the whole
    // chain stays in sync and tears down cleanly.
    for (let i = 0; i < stages.length; i += 1) {
      elapsed += stages[i].hold;
      const target = i + 1;
      const timer = setTimeout(() => {
        if (target >= stages.length) {
          setDone(true);
        } else {
          setIndex(target);
        }
      }, elapsed);
      timers.current.push(timer);
    }
    const captured = timers.current;
    return () => {
      captured.forEach(clearTimeout);
      timers.current = [];
    };
    // Stages are authored statically per mount; rerunning on identity churn is
    // not wanted, so the dependency list is intentionally the gates only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, finish]);

  useEffect(() => {
    if (done) {
      onDoneRef.current?.();
    }
  }, [done]);

  const stageId = stages[Math.min(index, lastIndex)]?.id ?? "";

  return { stageId, index, done, skip: finish };
}

/**
 * Convenience: the total authored run time of a set of stages, so a caller can
 * reserve layout or document the budget. Pure, no side effects.
 */
export function sequenceDuration(stages: SequenceStage[]): number {
  return stages.reduce((total, stage) => total + stage.hold, 0);
}
