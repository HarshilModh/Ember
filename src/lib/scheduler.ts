import type { Outcome } from "@/db/schema";

export interface SchedulerState {
  intervalDays: number;
  ease: number;
}

const MIN_INTERVAL = 1;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
// Not specified numerically in the README beyond "nudged up, capped at 3.0" —
// 0.1 matches the nudge SM-2 itself uses for an easy recall.
const EASE_NUDGE = 0.1;
const EASE_PENALTY = 0.2;

/** Pure fold: given the current scheduler state and an attempt's outcome, what's next. */
export function nextSchedule(state: SchedulerState, outcome: Outcome): SchedulerState {
  const { intervalDays, ease } = state;
  let nextInterval: number;
  let nextEase = ease;

  switch (outcome) {
    case "solved_clean":
      nextEase = Math.min(MAX_EASE, ease + EASE_NUDGE);
      nextInterval = intervalDays * nextEase;
      break;
    case "solved_hints":
      nextInterval = intervalDays * 1.3;
      break;
    case "accepted":
      nextInterval = intervalDays * 1.5;
      break;
    case "saw_solution":
      nextInterval = 2;
      nextEase = ease - EASE_PENALTY;
      break;
    case "failed":
      nextInterval = 1;
      nextEase = ease - EASE_PENALTY;
      break;
  }

  return {
    intervalDays: Math.max(MIN_INTERVAL, Math.round(nextInterval)),
    ease: Math.max(MIN_EASE, Number(nextEase.toFixed(2))),
  };
}

export function nextReviewAt(intervalDays: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + intervalDays);
  return d;
}
