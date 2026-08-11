import { quoteOfTheDay } from "./quotes";

/**
 * The header line, derived from your own numbers instead of a generic quote.
 *
 * A quote is advice for everyone, which makes it advice for no one — it reads
 * the same whether you closed six tasks yesterday or dropped all of them, so
 * the eye learns to skip it. These lines change with the data, and the one
 * shown is whichever fact should most change what you do in the next minute.
 */

export type PulseTone = "urgent" | "warn" | "good" | "neutral";

export type Pulse = {
  /** The number worth staring at. Empty renders the quote fallback instead. */
  value: string;
  /** Sits under the number. Kept short enough not to wrap. */
  unit: string;
  headline: string;
  detail: string;
  tone: PulseTone;
  action?: { href: string; label: string };
};

export type PulseInput = {
  streak: number;
  doneToday: number;
  overdue: number;
  /** Still-open tasks due today, overdue and in-progress included. */
  openToday: number;
  reviewsDue: number;
  /** Completions per day, oldest first, today last — as `completionsByDay`. */
  history: { day: string; count: number }[];
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function pulse(input: PulseInput, now = new Date()): Pulse {
  const { streak, doneToday, overdue, openToday, reviewsDue, history } = input;

  // Today is the last bucket; a "best day" has to beat the days before it.
  const prior = history.slice(0, -1);
  const priorBest = prior.reduce((max, d) => Math.max(max, d.count), 0);
  const window = prior.length;

  // First match wins. Order is the whole design: what is at stake beats what
  // has been earned, and what has been earned beats what is merely pending.
  if (streak >= 2 && doneToday === 0) {
    return {
      value: String(streak),
      unit: "days straight",
      headline: "Nothing closed yet.",
      detail:
        openToday > 0
          ? `The streak ends at midnight. ${openToday} ${plural(openToday, "task is", "tasks are")} sitting right there.`
          : "The streak ends at midnight. Close anything at all to keep it.",
      tone: "warn",
    };
  }

  if (overdue > 0 && doneToday === 0) {
    return {
      value: String(overdue),
      unit: plural(overdue, "task past due", "tasks past due"),
      headline: "Start with the oldest.",
      detail: "Clear one and the list goes quiet.",
      tone: "urgent",
    };
  }

  if (doneToday > 0 && doneToday > priorBest && window >= 3) {
    return {
      value: String(doneToday),
      unit: "closed today",
      headline: window >= 13 ? "Best day in two weeks." : "Best day so far.",
      detail:
        streak > 1
          ? `Day ${streak} of the streak, and the highest of them.`
          : "Nothing above this line but you.",
      tone: "good",
    };
  }

  if (doneToday > 0 && streak >= 2) {
    return {
      value: String(streak),
      unit: "days straight",
      headline: `${doneToday} closed today.`,
      detail:
        openToday > 0
          ? `Today is already counted. The other ${openToday} ${plural(openToday, "is", "are")} profit.`
          : "Today is already counted. Everything due is done.",
      tone: "good",
    };
  }

  if (doneToday > 0) {
    return {
      value: String(doneToday),
      unit: plural(doneToday, "closed today", "closed today"),
      headline: "The streak starts here.",
      detail: "Do it again tomorrow and it stops being a coincidence.",
      tone: "good",
    };
  }

  if (overdue > 0) {
    return {
      value: String(overdue),
      unit: plural(overdue, "still past due", "still past due"),
      headline: "Old work is still open.",
      detail: "These do not get easier by waiting.",
      tone: "urgent",
    };
  }

  if (openToday > 0) {
    return {
      value: String(openToday),
      unit: plural(openToday, "task due today", "tasks due today"),
      headline: "Pick the smallest one.",
      detail: "Starting is the whole trick — the rest follows on its own.",
      tone: "neutral",
    };
  }

  if (reviewsDue > 0) {
    return {
      value: String(reviewsDue),
      unit: plural(reviewsDue, "review due", "reviews due"),
      headline: "Nothing due, but recall fades.",
      detail: "Ten minutes now saves the re-solve later.",
      tone: "neutral",
      action: { href: "/practice", label: "Review" },
    };
  }

  // Nothing owed, nothing done, nothing pending — the one moment a quote is
  // actually the most useful thing to show.
  const quote = quoteOfTheDay(now);
  return {
    value: "",
    unit: "",
    headline: quote.text,
    detail: quote.who,
    tone: "neutral",
  };
}
