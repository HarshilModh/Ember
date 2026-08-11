import { DateTime } from "luxon";

export const PRIORITY_LABELS = ["none", "low", "medium", "high"] as const;
export const PRIORITY_COLORS = ["var(--p0)", "var(--p1)", "var(--p2)", "var(--p3)"] as const;

/**
 * Same fixed zone as src/lib/timezone.ts, under the NEXT_PUBLIC_ prefix
 * because this file is imported by client components too — a "which day is
 * this" question needs the same answer everywhere in the app, not one
 * answer server-side and a different one in whichever timezone a visitor's
 * own browser happens to be set to.
 */
const ZONE = process.env.NEXT_PUBLIC_EMBER_TIMEZONE?.trim() || "UTC";

function midnight(d: Date): number {
  return DateTime.fromJSDate(d).setZone(ZONE).startOf("day").toMillis();
}

/** Whole days between today and `d`. Negative means overdue. */
export function daysUntil(d: Date, now = new Date()): number {
  return Math.round((midnight(d) - midnight(now)) / 86_400_000);
}

/** "overdue by 2 days", "today", "tomorrow", "Thu", "12 Sep". */
export function relativeDue(d: Date, now = new Date()): string {
  const n = daysUntil(d, now);
  if (n < -1) return `${-n} days late`;
  if (n === -1) return "yesterday";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function dayHeading(d: Date, now = new Date()): string {
  const n = daysUntil(d, now);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

export function longDate(d = new Date()): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Value for a datetime-local input, in local time. */
export function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
