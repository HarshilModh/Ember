import { randomBytes, createHash } from "crypto";
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, lt, lte, or, sql as raw } from "drizzle-orm";
import { db } from "./client";
import {
  attempts,
  focusSessions,
  logs,
  mcpTokens,
  problems,
  tags,
  taskTags,
  tasks,
  type Attempt,
  type FocusSessionRow,
  type Log,
  type McpToken,
  type Outcome,
  type Problem,
  type Task,
} from "./schema";
import { nextReviewAt, nextSchedule } from "@/lib/scheduler";
import { startOfToday, endOfToday, daysFromToday, todayKey, sqlZone } from "@/lib/timezone";

/**
 * Inlined as raw SQL text, not a bound parameter — a fixed, trusted value
 * from our own env var, never user input. Binding it as a parameter instead
 * (`${sqlZone()}` directly in a tagged template) breaks GROUP BY: Postgres
 * sees each occurrence as a distinct, unproven-equal parameter and refuses
 * to accept the SELECT expression as functionally dependent on the GROUP BY
 * one, even though both bind to the identical string at runtime.
 */
const ZONE_SQL = raw.raw(`'${sqlZone()}'`);

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

/** Every task and log note this owner has, for the Settings export button. */
export async function exportAllTasks(ownerId: string): Promise<{ tasks: Task[]; logs: Log[] }> {
  const [taskRows, logRows] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.ownerId, ownerId)).orderBy(asc(tasks.createdAt)),
    db.select().from(logs).where(eq(logs.ownerId, ownerId)).orderBy(asc(logs.createdAt)),
  ]);
  return { tasks: taskRows, logs: logRows };
}

/** Completed today — the visible-progress list for the Today view. */
export async function doneTodayTasks(ownerId: string): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), eq(tasks.status, "done"), gte(tasks.completedAt, startOfToday())))
    .orderBy(desc(tasks.completedAt));
}

/** Title search for the command palette — open tasks first, then closed. */
export async function searchTasks(ownerId: string, query: string, limit = 8): Promise<Task[]> {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), ilike(tasks.title, `%${query}%`)))
    .orderBy(desc(inArray(tasks.status, [...OPEN])), asc(tasks.title))
    .limit(limit);
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

/**
 * Hard delete — unlike dropping a task (status -> "dropped"), this actually
 * removes the row. `logs` are append-only by design (see schema.ts), so a
 * log entry pointing at this task is detached (taskId -> null) rather than
 * deleted; `task_tags` rows and a `focus_sessions.active_task_id` reference
 * are cleaned up since neither carries that append-only guarantee.
 */
export async function deleteTask(ownerId: string, id: number): Promise<Task | undefined> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId))).limit(1);
    if (!row) return undefined;

    await tx.delete(taskTags).where(eq(taskTags.taskId, id));
    await tx.update(logs).set({ taskId: null }).where(and(eq(logs.taskId, id), eq(logs.ownerId, ownerId)));
    await tx
      .update(focusSessions)
      .set({ activeTaskId: null })
      .where(and(eq(focusSessions.activeTaskId, id), eq(focusSessions.ownerId, ownerId)));
    await tx.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)));

    return row;
  });
}

export async function setTaskDueDate(ownerId: string, id: number, dueAt: Date | null): Promise<Task | undefined> {
  const [row] = await db
    .update(tasks)
    .set({ dueAt })
    .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)))
    .returning();
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
    .select({ day: raw<string>`to_char(${tasks.completedAt} AT TIME ZONE ${ZONE_SQL}, 'YYYY-MM-DD')` })
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), eq(tasks.status, "done"), isNotNull(tasks.completedAt)))
    .groupBy(raw`${tasks.completedAt} AT TIME ZONE ${ZONE_SQL}`)
    .orderBy(desc(raw`${tasks.completedAt} AT TIME ZONE ${ZONE_SQL}`))
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
      day: raw<string>`to_char(${tasks.completedAt} AT TIME ZONE ${ZONE_SQL}, 'YYYY-MM-DD')`,
      count: raw<number>`count(*)::int`,
    })
    .from(tasks)
    .where(and(eq(tasks.ownerId, ownerId), eq(tasks.status, "done"), gte(tasks.completedAt, daysFromToday(-(days - 1)))))
    .groupBy(raw`${tasks.completedAt} AT TIME ZONE ${ZONE_SQL}`);

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

/**
 * Ranks weakest-first: failed, saw_solution, solved_hints, accepted, solved_clean.
 * Matches the DSA coach's explicit revision-day ordering rule.
 */
const OUTCOME_RANK: Record<Outcome, number> = {
  failed: 0,
  saw_solution: 1,
  solved_hints: 2,
  accepted: 3,
  solved_clean: 4,
};

export interface WithHistory {
  problem: Problem;
  lastOutcome: Outcome | null;
  lastAttemptedAt: Date | null;
  attemptCount: number;
  regressed: boolean;
}

/**
 * Shared by any list of problems that wants the last attempt's outcome
 * attached — due reviews, a pattern's problem list, etc. Flags `regressed`:
 * a revision attempt that came back worse than the best result before it —
 * solved clean once, failed on revision — which the coach is supposed to
 * call out rather than quietly reschedule.
 */
async function withAttemptHistory(ownerId: string, probs: Problem[]): Promise<WithHistory[]> {
  if (probs.length === 0) return [];

  const ids = probs.map((p) => p.id);
  const history = await db
    .select({
      problemId: attempts.problemId,
      outcome: attempts.outcome,
      isRevision: attempts.isRevision,
      attemptedAt: attempts.attemptedAt,
    })
    .from(attempts)
    .where(and(eq(attempts.ownerId, ownerId), inArray(attempts.problemId, ids)))
    .orderBy(asc(attempts.attemptedAt));

  const byProblem = new Map<number, typeof history>();
  for (const a of history) byProblem.set(a.problemId, [...(byProblem.get(a.problemId) ?? []), a]);

  return probs.map((problem) => {
    const past = byProblem.get(problem.id) ?? [];
    const last = past.at(-1);
    const bestBefore = past
      .slice(0, -1)
      .reduce<number | null>((best, a) => {
        const rank = OUTCOME_RANK[a.outcome as Outcome];
        return best === null ? rank : Math.max(best, rank);
      }, null);
    const lastOutcome = (last?.outcome as Outcome | undefined) ?? null;
    const regressed =
      !!last?.isRevision && bestBefore !== null && lastOutcome !== null && OUTCOME_RANK[lastOutcome] < bestBefore;
    return { problem, lastOutcome, lastAttemptedAt: last?.attemptedAt ?? null, attemptCount: past.length, regressed };
  });
}

/**
 * Due problems enriched with the last attempt's outcome and sorted weakest
 * first, so a revision day doesn't burn time on problems already solved
 * clean before hitting the ones that actually need re-teaching.
 */
export async function dueReviewsRanked(ownerId: string, limit = 20): Promise<WithHistory[]> {
  const due = await dueReviews(ownerId, 200);
  const enriched = await withAttemptHistory(ownerId, due);

  enriched.sort((a, b) => {
    if (a.regressed !== b.regressed) return a.regressed ? -1 : 1;
    const rankA = a.lastOutcome ? OUTCOME_RANK[a.lastOutcome] : -1;
    const rankB = b.lastOutcome ? OUTCOME_RANK[b.lastOutcome] : -1;
    if (rankA !== rankB) return rankA - rankB;
    return (a.problem.nextReviewAt?.getTime() ?? 0) - (b.problem.nextReviewAt?.getTime() ?? 0);
  });

  return enriched.slice(0, limit);
}

/** Every pattern tag in use, with how many problems carry it — for browsing without knowing the exact tag spelling. */
export async function allTopics(ownerId: string): Promise<{ topic: string; count: number }[]> {
  const rows = await db
    .select({ topic: raw<string>`unnest(${problems.topics})` })
    .from(problems)
    .where(eq(problems.ownerId, ownerId));

  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.topic, (counts.get(r.topic) ?? 0) + 1);
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

/** Every problem tagged with a pattern, enriched with last-outcome/regression so a "what have I already tried here" view doesn't need a follow-up lookup. */
export async function problemsByTopic(ownerId: string, topic: string, limit = 100): Promise<WithHistory[]> {
  const t = topic.trim().toLowerCase();
  const probs = await db
    .select()
    .from(problems)
    .where(and(eq(problems.ownerId, ownerId), raw`${t} = ANY(${problems.topics})`))
    .orderBy(desc(problems.createdAt))
    .limit(limit);
  return withAttemptHistory(ownerId, probs);
}

/** Merges in new tags without dropping existing ones — a problem can pick up a sharper pattern tag on a later attempt. */
export async function addTopics(ownerId: string, problemId: number, newTopics: string[]): Promise<Problem | undefined> {
  const [problem] = await db
    .select()
    .from(problems)
    .where(and(eq(problems.id, problemId), eq(problems.ownerId, ownerId)))
    .limit(1);
  if (!problem) return undefined;

  const merged = Array.from(new Set([...problem.topics, ...newTopics.map((t) => t.trim().toLowerCase()).filter(Boolean)]));
  const [row] = await db
    .update(problems)
    .set({ topics: merged })
    .where(and(eq(problems.id, problemId), eq(problems.ownerId, ownerId)))
    .returning();
  return row;
}

/** Problems manually flagged to revisit, independent of the SM-2 schedule. */
export async function pinnedProblems(ownerId: string, limit = 20): Promise<Problem[]> {
  return db
    .select()
    .from(problems)
    .where(and(eq(problems.ownerId, ownerId), eq(problems.pinnedForRevisit, true)))
    .orderBy(desc(problems.createdAt))
    .limit(limit);
}

export async function setPinnedForRevisit(ownerId: string, problemId: number, pinned: boolean): Promise<Problem | undefined> {
  const [row] = await db
    .update(problems)
    .set({ pinnedForRevisit: pinned })
    .where(and(eq(problems.id, problemId), eq(problems.ownerId, ownerId)))
    .returning();
  return row;
}

/** Deletes a problem and every attempt logged against it. */
export async function deleteProblem(ownerId: string, problemId: number): Promise<Problem | undefined> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(problems)
      .where(and(eq(problems.id, problemId), eq(problems.ownerId, ownerId)))
      .limit(1);
    if (!row) return undefined;
    await tx.delete(attempts).where(and(eq(attempts.problemId, problemId), eq(attempts.ownerId, ownerId)));
    await tx.delete(problems).where(and(eq(problems.id, problemId), eq(problems.ownerId, ownerId)));
    return row;
  });
}

/** Deletes a single logged attempt (e.g. to clean up a duplicate/mistaken log). */
export async function deleteAttempt(ownerId: string, attemptId: number): Promise<Attempt | undefined> {
  const [row] = await db
    .delete(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.ownerId, ownerId)))
    .returning();
  return row;
}

export async function recentAttempts(ownerId: string, limit = 10) {
  return db
    .select({
      id: attempts.id,
      outcome: attempts.outcome,
      minutes: attempts.minutes,
      notes: attempts.notes,
      approach: attempts.approach,
      isRevision: attempts.isRevision,
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
      approach: attempts.approach,
      isRevision: attempts.isRevision,
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

/**
 * Resolves a problem by slug, falling back to number — then creates one if
 * neither matches. This is what actually prevents the split-history bug: a
 * manual `log_attempt` with just a number creates a placeholder slug
 * (`leetcode-121`); if `sync:leetcode` later syncs the same problem under
 * its real slug (`best-time-to-buy-and-sell-stock`), a plain slug-only
 * lookup wouldn't find the placeholder and would create a second row,
 * silently splitting that problem's attempt history and review schedule in
 * two. Matching on number too finds the placeholder, and if the caller
 * supplied a real (non-placeholder) slug this time, upgrades it in place
 * instead of leaving two rows for the same problem.
 */
export async function findOrCreateProblem(
  ownerId: string,
  input: {
    slug?: string;
    number?: number | null;
    title: string;
    difficulty?: string | null;
    url?: string | null;
    topics?: string[];
  },
): Promise<Problem> {
  let existing = input.slug ? await findProblemBySlug(ownerId, input.slug) : undefined;
  if (!existing && input.number != null) existing = await findProblem(ownerId, String(input.number));

  if (existing) {
    const isPlaceholder = /^leetcode-\d+$/.test(existing.slug);
    const upgradeSlug = isPlaceholder && !!input.slug && input.slug !== existing.slug;
    const fillDifficulty = !existing.difficulty && !!input.difficulty;
    const fillUrl = !existing.url && !!input.url;
    if (!upgradeSlug && !fillDifficulty && !fillUrl) return existing;

    const [row] = await db
      .update(problems)
      .set({
        slug: upgradeSlug ? input.slug! : existing.slug,
        difficulty: fillDifficulty ? input.difficulty : existing.difficulty,
        url: fillUrl ? input.url : existing.url,
      })
      .where(and(eq(problems.id, existing.id), eq(problems.ownerId, ownerId)))
      .returning();
    return row;
  }

  return upsertProblem(ownerId, {
    slug: input.slug ?? `leetcode-${input.number}`,
    number: input.number ?? null,
    title: input.title,
    difficulty: input.difficulty ?? null,
    url: input.url ?? null,
    topics: input.topics ?? [],
  });
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
  opts?: {
    minutes?: number;
    notes?: string;
    approach?: string;
    isRevision?: boolean;
    source?: "manual" | "sync";
    attemptedAt?: Date;
  },
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
    approach: opts?.approach ?? null,
    isRevision: opts?.isRevision ?? false,
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

/** Cross-device read: the mac and the ipad both call this for the same owner. */
export async function getFocusSession(ownerId: string): Promise<FocusSessionRow | undefined> {
  const [row] = await db.select().from(focusSessions).where(eq(focusSessions.ownerId, ownerId)).limit(1);
  return row;
}

export async function saveFocusSession(
  ownerId: string,
  input: {
    phase: string;
    running: boolean;
    secondsLeft: number;
    totalDuration: number;
    focusCount: number;
    activeTaskId: number | null;
  },
): Promise<FocusSessionRow> {
  const [row] = await db
    .insert(focusSessions)
    .values({ ownerId, ...input, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: focusSessions.ownerId,
      set: { ...input, updatedAt: new Date() },
    })
    .returning();
  return row;
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
