import { randomBytes, createHash } from "crypto";
import { and, asc, desc, eq, gte, inArray, isNotNull, lt, lte, or, sql as raw } from "drizzle-orm";
import { db } from "./client";
import {
  attempts,
  logs,
  mcpTokens,
  problems,
  tags,
  taskTags,
  tasks,
  type Log,
  type McpToken,
  type Outcome,
  type Problem,
  type Task,
} from "./schema";
import { nextReviewAt, nextSchedule } from "@/lib/scheduler";
import { startOfToday, endOfToday, daysFromToday, todayKey, sqlZone } from "@/lib/timezone";

export const OPEN = ["todo", "doing"] as const;
export const CLOSED = ["done", "dropped"] as const;

export { startOfToday, endOfToday, daysFromToday };

/** Due today, overdue, or actively being worked on. */
export async function todayTasks(ownerId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.ownerId, ownerId),
        inArray(tasks.status, [...OPEN]),
        or(lt(tasks.dueAt, endOfToday()), eq(tasks.status, "doing")),
      ),
    )
    .orderBy(desc(tasks.status), desc(tasks.priority), asc(tasks.dueAt));
}

/** Open work due in the next 7 days, today included. */
export async function weekTasks(ownerId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.ownerId, ownerId),
        inArray(tasks.status, [...OPEN]),
        isNotNull(tasks.dueAt),
        gte(tasks.dueAt, startOfToday()),
        lt(tasks.dueAt, daysFromToday(7)),
      ),
    )
    .orderBy(asc(tasks.dueAt), desc(tasks.priority));
}

/** Everything still open, highest priority first. */
export async function allOpenTasks(ownerId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), inArray(tasks.status, [...OPEN])))
    .orderBy(desc(tasks.priority), asc(tasks.dueAt), asc(tasks.createdAt));
}

/** Done and dropped in the last `days`, for the toggle at the bottom of All. */
export async function recentlyClosedTasks(ownerId: string, days = 7): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.ownerId, ownerId),
        inArray(tasks.status, [...CLOSED]),
        or(gte(tasks.completedAt, daysFromToday(-days)), eq(tasks.status, "dropped")),
      ),
    )
    .orderBy(desc(tasks.completedAt))
    .limit(50);
}

/** Completed today — the visible-progress list for the Today view. */
export async function doneTodayTasks(ownerId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), eq(tasks.status, "done"), gte(tasks.completedAt, startOfToday())))
    .orderBy(desc(tasks.completedAt));
}

/** Scoped by owner so one person can never load another's task by guessing an id. */
export async function getTask(ownerId: string, id: number): Promise<Task | undefined> {
  const [row] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)))
    .limit(1);
  return row;
}

export async function taskLogs(ownerId: string, taskId: number) {
  return db
    .select()
    .from(logs)
    .where(and(eq(logs.taskId, taskId), eq(logs.ownerId, ownerId)))
    .orderBy(desc(logs.createdAt));
}

/**
 * Consecutive days ending today (or yesterday, so the streak is not declared
 * broken before the day is over) with at least one completed task.
 */
export async function completionStreak(ownerId: string): Promise<number> {
  // Bucketed in the app's timezone, not Postgres's own (usually UTC) — a task
  // completed at 11pm local should count for that local day, not roll into
  // the next UTC day.
  const rows = await db
    .select({ day: raw<string>`to_char(${tasks.completedAt} AT TIME ZONE ${sqlZone()}, 'YYYY-MM-DD')` })
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), eq(tasks.status, "done"), isNotNull(tasks.completedAt)))
    .groupBy(raw`${tasks.completedAt} AT TIME ZONE ${sqlZone()}`)
    .orderBy(desc(raw`${tasks.completedAt} AT TIME ZONE ${sqlZone()}`))
    .limit(400);

  const days = new Set(rows.map((r) => r.day));

  // Walked entirely as yyyy-MM-dd keys in the app's zone — no native Date day
  // arithmetic, which reads/writes the OS's own calendar, not the app's.
  let offset = 0;
  // Yesterday counting as the anchor keeps a real streak alive through a day
  // that simply has not been worked yet.
  if (!days.has(todayKey(0))) offset = -1;

  let streak = 0;
  while (days.has(todayKey(offset))) {
    streak += 1;
    offset -= 1;
  }
  return streak;
}

export async function doneToday(ownerId: string): Promise<number> {
  const [row] = await db
    .select({ n: raw<number>`count(*)::int` })
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), eq(tasks.status, "done"), gte(tasks.completedAt, startOfToday())));
  return row?.n ?? 0;
}

/** Attach tags by name, creating any that do not exist yet for this owner. */
export async function attachTags(ownerId: string, taskId: number, names: string[]) {
  const clean = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))];
  if (clean.length === 0) return;

  await db
    .insert(tags)
    .values(clean.map((name) => ({ ownerId, name })))
    .onConflictDoNothing();
  const rows = await db
    .select()
    .from(tags)
    .where(and(eq(tags.ownerId, ownerId), inArray(tags.name, clean)));
  await db
    .insert(taskTags)
    .values(rows.map((t) => ({ taskId, tagId: t.id })))
    .onConflictDoNothing();
}

export async function tagsForTasks(ownerId: string, taskIds: number[]): Promise<Map<number, string[]>> {
  const out = new Map<number, string[]>();
  if (taskIds.length === 0) return out;

  const rows = await db
    .select({ taskId: taskTags.taskId, name: tags.name })
    .from(taskTags)
    .innerJoin(tags, eq(tags.id, taskTags.tagId))
    .where(and(eq(tags.ownerId, ownerId), inArray(taskTags.taskId, taskIds)));

  for (const r of rows) {
    out.set(r.taskId, [...(out.get(r.taskId) ?? []), r.name]);
  }
  return out;
}

/** Completed tasks per day for the last `days` days, oldest first, zero-filled. */
export async function completionsByDay(ownerId: string, days = 7): Promise<{ day: string; count: number }[]> {
  const rows = await db
    .select({
      day: raw<string>`to_char(${tasks.completedAt} AT TIME ZONE ${sqlZone()}, 'YYYY-MM-DD')`,
      count: raw<number>`count(*)::int`,
    })
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), eq(tasks.status, "done"), gte(tasks.completedAt, daysFromToday(-(days - 1)))))
    .groupBy(raw`${tasks.completedAt} AT TIME ZONE ${sqlZone()}`);

  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const out: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = todayKey(-i);
    out.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return out;
}

/**
 * What happened this week, task-side: closed tasks with the notes logged
 * against them, oldest first. Dropped tasks have no timestamp of their own
 * (see `recentlyClosedTasks`), so they show up regardless of when they were
 * dropped rather than being silently excluded.
 */
export async function weeklyRollup(ownerId: string, days = 7): Promise<{ task: Task; notes: Log[] }[]> {
  const closed = await recentlyClosedTasks(ownerId, days);
  const ids = closed.map((t) => t.id);
  const notesByTask = new Map<number, Log[]>();
  if (ids.length > 0) {
    const rows = await db
      .select()
      .from(logs)
      .where(and(eq(logs.ownerId, ownerId), inArray(logs.taskId, ids)))
      .orderBy(asc(logs.createdAt));
    for (const r of rows) {
      if (r.taskId == null) continue;
      notesByTask.set(r.taskId, [...(notesByTask.get(r.taskId) ?? []), r]);
    }
  }
  return closed
    .slice()
    .reverse()
    .map((task) => ({ task, notes: notesByTask.get(task.id) ?? [] }));
}

// ---- Practice tracking (Phase 2) ----

/** Problems due for review, most overdue first. */
export async function dueReviews(ownerId: string, limit = 20): Promise<Problem[]> {
  return db
    .select()
    .from(problems)
    .where(and(eq(problems.ownerId, ownerId), isNotNull(problems.nextReviewAt), lte(problems.nextReviewAt, new Date())))
    .orderBy(asc(problems.nextReviewAt))
    .limit(limit);
}

export async function recentAttempts(ownerId: string, limit = 10) {
  return db
    .select({
      id: attempts.id,
      outcome: attempts.outcome,
      minutes: attempts.minutes,
      notes: attempts.notes,
      source: attempts.source,
      attemptedAt: attempts.attemptedAt,
      problemId: attempts.problemId,
      title: problems.title,
      number: problems.number,
      difficulty: problems.difficulty,
    })
    .from(attempts)
    .innerJoin(problems, eq(problems.id, attempts.problemId))
    .where(eq(attempts.ownerId, ownerId))
    .orderBy(desc(attempts.attemptedAt))
    .limit(limit);
}

/** Attempts logged in the last `days` days, most recent first — the practice half of the weekly rollup. */
export async function attemptsInLast(ownerId: string, days = 7) {
  return db
    .select({
      id: attempts.id,
      outcome: attempts.outcome,
      minutes: attempts.minutes,
      notes: attempts.notes,
      source: attempts.source,
      attemptedAt: attempts.attemptedAt,
      problemId: attempts.problemId,
      title: problems.title,
      number: problems.number,
      difficulty: problems.difficulty,
    })
    .from(attempts)
    .innerJoin(problems, eq(problems.id, attempts.problemId))
    .where(and(eq(attempts.ownerId, ownerId), gte(attempts.attemptedAt, daysFromToday(-(days - 1)))))
    .orderBy(desc(attempts.attemptedAt));
}

const STRUGGLE_OUTCOMES = ["saw_solution", "failed"];

/** Attempts grouped by topic, ranked by struggle rate — "what should I drill." */
export async function topicBreakdown(ownerId: string) {
  const rows = await db
    .select({ topic: raw<string>`unnest(${problems.topics})`, outcome: attempts.outcome })
    .from(attempts)
    .innerJoin(problems, eq(problems.id, attempts.problemId))
    .where(eq(attempts.ownerId, ownerId));

  const byTopic = new Map<string, { total: number; struggled: number }>();
  for (const r of rows) {
    const entry = byTopic.get(r.topic) ?? { total: 0, struggled: 0 };
    entry.total += 1;
    if (STRUGGLE_OUTCOMES.includes(r.outcome)) entry.struggled += 1;
    byTopic.set(r.topic, entry);
  }

  return [...byTopic.entries()]
    .map(([topic, v]) => ({ topic, ...v, strugglePct: Math.round((v.struggled / v.total) * 100) }))
    .sort((a, b) => b.strugglePct - a.strugglePct || b.total - a.total);
}

/** Distinct problems solved, plus attempt volume and accuracy per difficulty. */
export async function practiceStats(ownerId: string) {
  const rows = await db
    .select({ difficulty: problems.difficulty, outcome: attempts.outcome, problemId: attempts.problemId })
    .from(attempts)
    .innerJoin(problems, eq(problems.id, attempts.problemId))
    .where(eq(attempts.ownerId, ownerId));

  const solvedIds = new Set<number>();
  const byDifficulty = new Map<string, { attempts: number; ok: number }>();
  for (const r of rows) {
    if (r.outcome !== "failed") solvedIds.add(r.problemId);
    const diff = r.difficulty ?? "unknown";
    const entry = byDifficulty.get(diff) ?? { attempts: 0, ok: 0 };
    entry.attempts += 1;
    if (!STRUGGLE_OUTCOMES.includes(r.outcome)) entry.ok += 1;
    byDifficulty.set(diff, entry);
  }

  return {
    problemsSolved: solvedIds.size,
    byDifficulty: [...byDifficulty.entries()].map(([difficulty, v]) => ({
      difficulty,
      attempts: v.attempts,
      accuracyPct: Math.round((v.ok / v.attempts) * 100),
    })),
  };
}

export async function getProblem(ownerId: string, id: number): Promise<Problem | undefined> {
  const [row] = await db
    .select()
    .from(problems)
    .where(and(eq(problems.id, id), eq(problems.ownerId, ownerId)))
    .limit(1);
  return row;
}

export async function problemAttempts(ownerId: string, problemId: number, limit = 10) {
  return db
    .select()
    .from(attempts)
    .where(and(eq(attempts.problemId, problemId), eq(attempts.ownerId, ownerId)))
    .orderBy(desc(attempts.attemptedAt))
    .limit(limit);
}

/** Slug for sync/MCP upserts, or a bare LeetCode problem number typed by hand. */
export async function findProblem(ownerId: string, slugOrNumber: string): Promise<Problem | undefined> {
  const asNumber = Number(slugOrNumber);
  const byNumber = Number.isFinite(asNumber) && String(asNumber) === slugOrNumber.trim();
  const [row] = await db
    .select()
    .from(problems)
    .where(
      and(
        eq(problems.ownerId, ownerId),
        byNumber ? eq(problems.number, asNumber) : eq(problems.slug, slugOrNumber),
      ),
    )
    .limit(1);
  return row;
}

export async function findProblemBySlug(ownerId: string, slug: string): Promise<Problem | undefined> {
  const [row] = await db
    .select()
    .from(problems)
    .where(and(eq(problems.ownerId, ownerId), eq(problems.slug, slug)))
    .limit(1);
  return row;
}

export async function upsertProblem(
  ownerId: string,
  input: {
    slug: string;
    number?: number | null;
    title: string;
    difficulty?: string | null;
    url?: string | null;
    topics?: string[];
  },
): Promise<Problem> {
  const [row] = await db
    .insert(problems)
    .values({
      ownerId,
      slug: input.slug,
      number: input.number ?? null,
      title: input.title,
      difficulty: input.difficulty ?? null,
      url: input.url ?? null,
      topics: input.topics ?? [],
    })
    .onConflictDoUpdate({
      target: [problems.ownerId, problems.slug],
      set: {
        title: input.title,
        difficulty: input.difficulty ?? null,
        url: input.url ?? null,
      },
    })
    .returning();
  return row;
}

export async function hasAttemptAt(ownerId: string, problemId: number, attemptedAt: Date): Promise<boolean> {
  const [row] = await db
    .select({ id: attempts.id })
    .from(attempts)
    .where(and(eq(attempts.ownerId, ownerId), eq(attempts.problemId, problemId), eq(attempts.attemptedAt, attemptedAt)))
    .limit(1);
  return !!row;
}

/**
 * Append an attempt, fold it into the SM-2-lite scheduler, and persist the new
 * schedule on the problem row so the "due for review" query stays a single
 * indexed scan. Returns the next review date.
 */
export async function recordAttempt(
  ownerId: string,
  problemId: number,
  outcome: Outcome,
  opts?: { minutes?: number; notes?: string; source?: "manual" | "sync"; attemptedAt?: Date },
): Promise<Date> {
  const [problem] = await db
    .select()
    .from(problems)
    .where(and(eq(problems.id, problemId), eq(problems.ownerId, ownerId)))
    .limit(1);
  if (!problem) throw new Error(`No problem with id ${problemId}`);

  await db.insert(attempts).values({
    ownerId,
    problemId,
    outcome,
    minutes: opts?.minutes ?? null,
    notes: opts?.notes ?? null,
    source: opts?.source ?? "manual",
    attemptedAt: opts?.attemptedAt ?? new Date(),
  });

  const next = nextSchedule({ intervalDays: problem.intervalDays, ease: problem.ease }, outcome);
  const nextAt = nextReviewAt(next.intervalDays);
  await db
    .update(problems)
    .set({ intervalDays: next.intervalDays, ease: next.ease, nextReviewAt: nextAt })
    .where(and(eq(problems.id, problemId), eq(problems.ownerId, ownerId)));

  return nextAt;
}

// ---- Remote MCP tokens ----

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Plaintext is returned once here and never again — only the hash is stored. */
export async function createMcpToken(ownerId: string, label: string): Promise<{ id: number; token: string }> {
  const token = `ember_${randomBytes(24).toString("base64url")}`;
  const [row] = await db
    .insert(mcpTokens)
    .values({ ownerId, label: label.trim() || "Unnamed token", tokenHash: hashToken(token) })
    .returning();
  return { id: row.id, token };
}

export async function listMcpTokens(ownerId: string): Promise<McpToken[]> {
  return db.select().from(mcpTokens).where(eq(mcpTokens.ownerId, ownerId)).orderBy(desc(mcpTokens.createdAt));
}

export async function revokeMcpToken(ownerId: string, id: number): Promise<void> {
  await db.delete(mcpTokens).where(and(eq(mcpTokens.id, id), eq(mcpTokens.ownerId, ownerId)));
}

/** The only thing the remote MCP route trusts. Null means reject the request. */
export async function resolveOwnerFromToken(token: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(mcpTokens)
    .where(eq(mcpTokens.tokenHash, hashToken(token)))
    .limit(1);
  if (!row) return null;
  await db.update(mcpTokens).set({ lastUsedAt: new Date() }).where(eq(mcpTokens.id, row.id));
  return row.ownerId;
}
