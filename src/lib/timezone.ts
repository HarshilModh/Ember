import { DateTime } from "luxon";

/**
 * One fixed zone for the whole deployment. "Today" is meaningless without
 * picking a timezone, and the moment this app runs in two places at once —
 * your laptop and a server — relying on whichever OS timezone happens to be
 * running the code gives two different answers for "is this due today"
 * depending on which one you're looking at. That's not hypothetical: it's
 * exactly what made tasks disappear on the deployed site while still
 * showing locally. Pick one zone explicitly instead.
 */
const ZONE = process.env.NEXT_PUBLIC_EMBER_TIMEZONE?.trim() || "UTC";

function now(): DateTime {
  return DateTime.now().setZone(ZONE);
}

export function startOfToday(): Date {
  return now().startOf("day").toJSDate();
}

export function endOfToday(): Date {
  return now().plus({ days: 1 }).startOf("day").toJSDate();
}

export function daysFromToday(n: number): Date {
  return now().startOf("day").plus({ days: n }).toJSDate();
}

/** 23:59 on the given calendar day, in the app's timezone — not midnight, so a bare due-date isn't instantly overdue. */
export function endOfDay(year: number, month: number, day: number): Date {
  return DateTime.fromObject({ year, month, day, hour: 23, minute: 59 }, { zone: ZONE }).toJSDate();
}

export function todayParts(): { year: number; month: number; day: number } {
  const d = now();
  return { year: d.year, month: d.month, day: d.day };
}

export function tomorrowParts(): { year: number; month: number; day: number } {
  const d = now().plus({ days: 1 });
  return { year: d.year, month: d.month, day: d.day };
}

/** yyyy-MM-dd for today + offsetDays, walked entirely in the app's zone — never touches native Date day arithmetic, which is OS-timezone-dependent. */
export function todayKey(offsetDays = 0): string {
  return now().plus({ days: offsetDays }).toFormat("yyyy-MM-dd");
}

/** A stored instant, broken into calendar parts in the app's zone — for display, never `d.getHours()` etc, which reads whichever machine is running the code. */
export function zonedParts(d: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const t = DateTime.fromJSDate(d).setZone(ZONE);
  return { year: t.year, month: t.month, day: t.day, hour: t.hour, minute: t.minute };
}

/** For SQL — bucket completed_at/attempted_at by calendar day in the same zone the app reasons in, not the database's own default (usually UTC). */
export function sqlZone(): string {
  return ZONE;
}
