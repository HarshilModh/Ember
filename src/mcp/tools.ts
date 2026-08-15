import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { db, friendlyDbError } from "@/db/client";
import {
  addTopics,
  attachTags,
  deleteAttempt,
  deleteProblem,
  dueReviewsRanked,
  findProblem,
  findProblemBySlug,
  OPEN,
  pinnedProblems,
  problemAttempts,
  recordAttempt,
  setPinnedForRevisit,
  tagsForTasks,
  upsertProblem,
} from "@/db/queries";
import { logs, tags, taskTags, tasks, type Outcome } from "@/db/schema";
import { daysFromToday, endOfDay, todayParts, tomorrowParts, zonedParts } from "@/lib/timezone";

const OUTCOMES = ["solved_clean", "solved_hints", "saw_solution", "failed", "accepted"] as const;
const PRIORITY_NAMES = ["none", "low", "medium", "high"] as const;

/**
 * Accepts an ISO date, an ISO datetime, or the two words worth special-casing.
 * "today"/"tomorrow" and bare dates resolve in the app's fixed timezone
 * (NEXT_PUBLIC_EMBER_TIMEZONE), not whichever machine happens to run this — this same
 * request can be served by a laptop or by Vercel depending on which
 * transport it came in on, and those two disagree about what day it is for
 * hours at a time otherwise.
 */
function parseDue(input?: string): Date | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();

  if (s === "today" || s === "tomorrow") {
    const { year, month, day } = s === "today" ? todayParts() : tomorrowParts();
    return endOfDay(year, month, day);
  }

  // A bare date means end of that day, not midnight at its start — otherwise
  // "due 2026-08-12" is already overdue for the whole of the 12th.
  const bareDate = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (bareDate) return endOfDay(Number(bareDate[1]), Number(bareDate[2]), Number(bareDate[3]));

  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error(`Could not read "${input}" as a date.`);
  return d;
}

/**
 * In the app's timezone, deliberately not the runtime's own. This tool can
 * run on a laptop (stdio) or on Vercel (remote HTTP) depending on how it was
 * called — `d.getHours()` reads whichever one that happened to be, so a task
 * due 23:59 locally could render as tomorrow morning to a server in UTC.
 */
function formatDue(d: Date): string {
  const { year, month, day, hour, minute } = zonedParts(d);
  const p = (n: number) => String(n).padStart(2, "0");
  const date = `${year}-${p(month)}-${p(day)}`;
  // End-of-day is the default for a bare date, so the time is noise there.
  if (hour === 23 && minute === 59) return date;
  return `${date} ${p(hour)}:${p(minute)}`;
}

/** Review dates are day-granularity — no point showing a time of day for them. */
function formatDate(d: Date): string {
  const { year, month, day } = zonedParts(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${year}-${p(month)}-${p(day)}`;
}

/**
 * For backdating a log_attempt call — unlike parseDue, "undefined" here means
 * "now" (recordAttempt's own default), not "no date filter." Only used when
 * the caller explicitly wants to record something that happened earlier,
 * e.g. relogging yesterday's solves.
 */
function parseAttemptDate(input?: string): Date | undefined {
  if (!input) return undefined;
  const s = input.trim().toLowerCase();
  if (s === "today") return new Date();
  if (s === "yesterday") return daysFromToday(-1);

  const bareDate = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (bareDate) return endOfDay(Number(bareDate[1]), Number(bareDate[2]), Number(bareDate[3]));

  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error(`Could not read "${input}" as a date.`);
  return d;
}

function render(t: typeof tasks.$inferSelect, tagNames: string[] = []): string {
  const bits = [`#${t.id}`, t.title];
  if (t.priority > 0) bits.push(`(${PRIORITY_NAMES[t.priority]})`);
  if (t.status !== "todo") bits.push(`[${t.status}]`);
  if (t.dueAt) bits.push(`due ${formatDue(t.dueAt)}`);
  if (tagNames.length) bits.push(tagNames.map((n) => `#${n}`).join(" "));
  return bits.join(" ");
}

const ok = (text: string) => ({ content: [{ type: "text" as const, text }] });
const fail = (text: string) => ({ content: [{ type: "text" as const, text }], isError: true });

/** Every tool body runs through this so a stopped database reads as English. */
async function guard<T>(fn: () => Promise<T>, onOk: (v: T) => ReturnType<typeof ok>) {
  try {
    return onOk(await fn());
  } catch (err) {
    console.error(err);
    return fail(friendlyDbError(err));
  }
}

/**
 * Builds a fresh server scoped to one owner. Called once per stdio process
 * (owner fixed at startup from EMBER_OWNER_EMAIL) and once per HTTP request
 * on the remote route (owner resolved per-request from the caller's token) —
 * the tool definitions themselves don't know or care which caller they're
 * running for.
 */
export function createEmberMcpServer(ownerId: string): McpServer {
  const server = new McpServer({ name: "ember", version: "0.1.0" });

  server.registerTool(
    "add_task",
    {
      title: "Add task",
      description:
        "Add a task to Ember. Use this whenever the user mentions something they need to do.",
      inputSchema: {
        title: z.string().min(1).describe("What needs doing"),
        notes: z.string().optional().describe("Any extra detail worth keeping"),
        priority: z
          .union([z.number().int().min(0).max(3), z.enum(PRIORITY_NAMES)])
          .optional()
          .describe("0/none, 1/low, 2/medium, 3/high"),
        due_at: z
          .string()
          .optional()
          .describe("ISO date or datetime, or 'today' / 'tomorrow'"),
        tags: z.array(z.string()).optional(),
      },
    },
    async ({ title, notes, priority, due_at, tags: tagNames }) =>
      guard(
        async () => {
          const p =
            typeof priority === "string" ? PRIORITY_NAMES.indexOf(priority) : (priority ?? 0);
          const [row] = await db
            .insert(tasks)
            .values({ ownerId, title, notes: notes ?? null, priority: p, dueAt: parseDue(due_at) })
            .returning();
          if (tagNames?.length) await attachTags(ownerId, row.id, tagNames);
          return { row, tagNames: tagNames ?? [] };
        },
        ({ row, tagNames }) => ok(`Added ${render(row, tagNames)}`),
      ),
  );

  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description:
        "List tasks from Ember. With no filters this returns open work (todo and doing).",
      inputSchema: {
        status: z.enum(["todo", "doing", "done", "dropped", "open", "all"]).optional(),
        due_before: z.string().optional().describe("ISO date, or 'today' / 'tomorrow'"),
        tag: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      },
    },
    async ({ status, due_before, tag, limit }) =>
      guard(
        async () => {
          const where = [eq(tasks.ownerId, ownerId)];
          if (!status || status === "open") where.push(inArray(tasks.status, [...OPEN]));
          else if (status !== "all") where.push(eq(tasks.status, status));

          const before = parseDue(due_before);
          if (before) where.push(lt(tasks.dueAt, before));

          const base = db.select({ t: tasks }).from(tasks).$dynamic();
          const q = tag
            ? base
                .innerJoin(taskTags, eq(taskTags.taskId, tasks.id))
                .innerJoin(tags, eq(tags.id, taskTags.tagId))
                .where(and(...where, eq(tags.ownerId, ownerId), eq(tags.name, tag.trim().toLowerCase())))
            : base.where(and(...where));

          const rows = await q
            .orderBy(desc(tasks.priority), asc(tasks.dueAt), asc(tasks.id))
            .limit(limit ?? 50);

          const found = rows.map((r) => r.t);
          return { found, byTask: await tagsForTasks(ownerId, found.map((t) => t.id)) };
        },
        ({ found, byTask }) =>
          ok(
            found.length === 0
              ? "No matching tasks."
              : found.map((t) => render(t, byTask.get(t.id) ?? [])).join("\n"),
          ),
      ),
  );

  server.registerTool(
    "complete_task",
    {
      title: "Complete task",
      description: "Mark a task done and stamp when it was finished.",
      inputSchema: { id: z.number().int().describe("Task id") },
    },
    async ({ id }) =>
      guard(
        async () => {
          const [row] = await db
            .update(tasks)
            .set({ status: "done", completedAt: new Date() })
            .where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId)))
            .returning();
          return row;
        },
        (row) => (row ? ok(`Completed ${render(row)}`) : fail(`No task with id ${id}.`)),
      ),
  );

  server.registerTool(
    "log_note",
    {
      title: "Log note",
      description:
        "Append a note to the work log. Pass a task_id to attach it to a task, or leave it off for a loose note.",
      inputSchema: {
        note: z.string().min(1),
        task_id: z.number().int().optional(),
      },
    },
    async ({ note, task_id }) =>
      guard(
        async () => {
          if (task_id !== undefined) {
            const [t] = await db
              .select()
              .from(tasks)
              .where(and(eq(tasks.id, task_id), eq(tasks.ownerId, ownerId)))
              .limit(1);
            if (!t) return null;
          }
          const [row] = await db
            .insert(logs)
            .values({ ownerId, note, taskId: task_id ?? null })
            .returning();
          return row;
        },
        (row) =>
          row
            ? ok(row.taskId ? `Logged against task #${row.taskId}.` : "Logged.")
            : fail(`No task with id ${task_id}.`),
      ),
  );

  server.registerTool(
    "log_attempt",
    {
      title: "Log a LeetCode attempt",
      description:
        "Record an attempt at a LeetCode problem (identified by slug or number) and reschedule its next review.",
      inputSchema: {
        slug: z.string().optional().describe("e.g. 'trapping-rain-water'"),
        number: z.number().int().optional().describe("e.g. 42"),
        outcome: z.enum(OUTCOMES),
        minutes: z.number().int().optional(),
        notes: z.string().optional().describe("Free-form notes about the attempt"),
        approach: z
          .string()
          .optional()
          .describe("The technique/pattern used to solve it, e.g. 'two pointers' or 'sliding window'"),
        date: z
          .string()
          .optional()
          .describe(
            "When this was actually attempted, for backdating a log entered late — 'today' (default if omitted), 'yesterday', or an ISO date/datetime",
          ),
        is_revision: z
          .boolean()
          .optional()
          .describe("True if this is a blank-file re-solve of a problem already seen, not a first pass"),
        title: z.string().optional().describe("Only used if this problem hasn't been logged before"),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        url: z.string().optional(),
        topics: z
          .array(z.string())
          .optional()
          .describe(
            "Pattern tags, e.g. 'monotonic-stack' not just 'stack'. Merged into the problem's existing tags — nothing is dropped, even on a problem logged before.",
          ),
      },
    },
    async ({ slug, number, outcome, minutes, notes, approach, date, is_revision, title, difficulty, url, topics }) =>
      guard(
        async () => {
          if (!slug && number === undefined) throw new Error("Provide a slug or a problem number.");

          let problem = slug
            ? await findProblemBySlug(ownerId, slug)
            : await findProblem(ownerId, String(number));
          if (!problem) {
            problem = await upsertProblem(ownerId, {
              slug: slug ?? `leetcode-${number}`,
              number: number ?? null,
              title: title ?? slug ?? `Problem #${number}`,
              difficulty: difficulty ?? null,
              url: url ?? null,
              topics: topics ?? [],
            });
          } else if (topics?.length) {
            problem = (await addTopics(ownerId, problem.id, topics)) ?? problem;
          }

          const nextAt = await recordAttempt(ownerId, problem.id, outcome as Outcome, {
            minutes,
            notes,
            approach,
            isRevision: is_revision,
            source: "manual",
            attemptedAt: parseAttemptDate(date),
          });
          return { problem, nextAt };
        },
        ({ problem, nextAt }) =>
          ok(`Logged ${outcome} for ${problem.title}. Next review ${formatDate(nextAt)}.`),
      ),
  );

  server.registerTool(
    "list_reviews",
    {
      title: "List due reviews",
      description:
        "List LeetCode problems due for review, weakest result first (failed, saw_solution, solved_hints, then solved_clean) so a revision session tackles the ones that need re-teaching before the easy re-confirms. Flags a problem that was solved before but failed on a later revision attempt.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      },
    },
    async ({ limit, difficulty }) =>
      guard(
        async () => {
          const rows = await dueReviewsRanked(ownerId, limit ?? 20);
          return difficulty ? rows.filter((r) => r.problem.difficulty === difficulty) : rows;
        },
        (rows) =>
          ok(
            rows.length === 0
              ? "Nothing due for review."
              : rows
                  .map(({ problem: p, lastOutcome, regressed }) => {
                    const bits = [p.number ? `#${p.number}` : p.slug, p.title];
                    if (p.difficulty) bits.push(`(${p.difficulty})`);
                    if (lastOutcome) bits.push(`last: ${lastOutcome}`);
                    if (p.nextReviewAt) bits.push(`due ${formatDate(p.nextReviewAt)}`);
                    if (p.pinnedForRevisit) bits.push("[pinned]");
                    if (regressed) bits.push("⚠ REGRESSED on revision — solved before, weaker now");
                    return bits.join(" ");
                  })
                  .join("\n"),
          ),
      ),
  );

  /** Shared by every tool below that identifies a problem by slug or number. */
  async function resolveProblem(slug?: string, number?: number) {
    if (!slug && number === undefined) throw new Error("Provide a slug or a problem number.");
    const problem = slug ? await findProblemBySlug(ownerId, slug) : await findProblem(ownerId, String(number));
    if (!problem) throw new Error(`No problem found for ${slug ?? `#${number}`}.`);
    return problem;
  }

  server.registerTool(
    "set_revisit",
    {
      title: "Flag/unflag a problem to revisit",
      description:
        "Manually mark a LeetCode problem to revisit (or clear that flag), independent of the spaced-repetition schedule. Shows up in its own 'pinned for revisit' list.",
      inputSchema: {
        slug: z.string().optional(),
        number: z.number().int().optional(),
        revisit: z.boolean().describe("true to pin it for revisit, false to unpin"),
      },
    },
    async ({ slug, number, revisit }) =>
      guard(
        async () => {
          const problem = await resolveProblem(slug, number);
          const row = await setPinnedForRevisit(ownerId, problem.id, revisit);
          return row!;
        },
        (row) => ok(revisit ? `Pinned "${row.title}" for revisit.` : `Unpinned "${row.title}".`),
      ),
  );

  server.registerTool(
    "list_pinned_problems",
    {
      title: "List problems pinned for revisit",
      description: "List LeetCode problems manually flagged to revisit (set via set_revisit).",
      inputSchema: { limit: z.number().int().min(1).max(100).optional() },
    },
    async ({ limit }) =>
      guard(
        () => pinnedProblems(ownerId, limit ?? 20),
        (rows) =>
          ok(
            rows.length === 0
              ? "Nothing pinned for revisit."
              : rows.map((p) => [p.number ? `#${p.number}` : p.slug, p.title].join(" ")).join("\n"),
          ),
      ),
  );

  server.registerTool(
    "delete_problem",
    {
      title: "Delete a LeetCode problem",
      description:
        "Permanently delete a LeetCode problem and every attempt logged against it (e.g. to clean up test data or something logged by mistake). This cannot be undone.",
      inputSchema: {
        slug: z.string().optional(),
        number: z.number().int().optional(),
      },
    },
    async ({ slug, number }) =>
      guard(
        async () => {
          const problem = await resolveProblem(slug, number);
          const row = await deleteProblem(ownerId, problem.id);
          return row!;
        },
        (row) => ok(`Deleted "${row.title}" and all of its logged attempts.`),
      ),
  );

  server.registerTool(
    "delete_attempt",
    {
      title: "Delete a single logged attempt",
      description:
        "Permanently delete one logged attempt by id (e.g. to remove a duplicate or mistaken log_attempt call), without touching the problem or its other attempts. Use list_reviews/problemAttempts context or the attempt id shown in the app to find the id. This cannot be undone.",
      inputSchema: { id: z.number().int().describe("Attempt id") },
    },
    async ({ id }) =>
      guard(
        () => deleteAttempt(ownerId, id),
        (row) => (row ? ok(`Deleted attempt #${row.id} (${row.outcome}).`) : fail(`No attempt with id ${id}.`)),
      ),
  );

  server.registerTool(
    "list_attempts",
    {
      title: "List attempts for a problem",
      description: "List logged attempts for one LeetCode problem, most recent first — useful for finding an attempt id to delete.",
      inputSchema: {
        slug: z.string().optional(),
        number: z.number().int().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ slug, number, limit }) =>
      guard(
        async () => {
          const problem = await resolveProblem(slug, number);
          return problemAttempts(ownerId, problem.id, limit ?? 10);
        },
        (rows) =>
          ok(
            rows.length === 0
              ? "No attempts logged for this problem."
              : rows
                  .map((a) => {
                    const bits = [`#${a.id}`, a.outcome, `(${a.source}${a.isRevision ? ", revision" : ""})`, formatDue(a.attemptedAt)];
                    if (a.approach) bits.push(`approach: ${a.approach}`);
                    if (a.notes) bits.push(`notes: ${a.notes}`);
                    return bits.join(" ");
                  })
                  .join("\n"),
          ),
      ),
  );

  return server;
}
