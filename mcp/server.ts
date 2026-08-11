import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { and, asc, desc, eq, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { db, friendlyDbError, sql } from "../src/db/client";
import {
  attachTags,
  dueReviews,
  findProblem,
  findProblemBySlug,
  OPEN,
  recordAttempt,
  tagsForTasks,
  upsertProblem,
} from "../src/db/queries";
import { logs, tags, taskTags, tasks, type Outcome } from "../src/db/schema";

const OUTCOMES = ["solved_clean", "solved_hints", "saw_solution", "failed", "accepted"] as const;

// stdio is the transport. Anything written to stdout that is not a protocol
// message corrupts the stream, so diagnostics go to stderr only.
const log = (...args: unknown[]) => console.error("[ember]", ...args);

/**
 * Multiple people can point their own local MCP server at the same shared
 * database. There is no session here the way the web app has one via Clerk,
 * so ownership is whatever this process was told to be at startup — the
 * env var is the only source of truth. Getting this wrong means either
 * seeing nothing (safe, just confusing) or, if copy-pasted from someone
 * else's config, operating on their data — so fail loudly rather than guess.
 */
const OWNER_ID = process.env.EMBER_OWNER_EMAIL?.trim();
if (!OWNER_ID) {
  console.error(
    "[ember] EMBER_OWNER_EMAIL is not set. Add it to this server's env in your MCP config " +
      "(the same email you sign in with) — see the in-app Help page.",
  );
  process.exit(1);
}

const PRIORITY_NAMES = ["none", "low", "medium", "high"] as const;

/** Accepts an ISO date, an ISO datetime, or the two words worth special-casing. */
function parseDue(input?: string): Date | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();

  if (s === "today" || s === "tomorrow") {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    if (s === "tomorrow") d.setDate(d.getDate() + 1);
    return d;
  }

  // A bare date means end of that day, not midnight at its start — otherwise
  // "due 2026-08-12" is already overdue for the whole of the 12th.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T23:59:00`);

  const d = new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error(`Could not read "${input}" as a date.`);
  return d;
}

/**
 * Local time, deliberately not ISO. A task due 23:59 tonight renders as
 * tomorrow morning in UTC, which reads as a wrong answer to anyone checking.
 */
function formatDue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  // End-of-day is the default for a bare date, so the time is noise there.
  if (d.getHours() === 23 && d.getMinutes() === 59) return date;
  return `${date} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Review dates are day-granularity — no point showing a time of day for them. */
function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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

/** Every tool body runs through this so a stopped container reads as English. */
async function guard<T>(fn: () => Promise<T>, onOk: (v: T) => ReturnType<typeof ok>) {
  try {
    return onOk(await fn());
  } catch (err) {
    log(err);
    return fail(friendlyDbError(err));
  }
}

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
          .values({ ownerId: OWNER_ID, title, notes: notes ?? null, priority: p, dueAt: parseDue(due_at) })
          .returning();
        if (tagNames?.length) await attachTags(OWNER_ID, row.id, tagNames);
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
        const where = [eq(tasks.ownerId, OWNER_ID)];
        if (!status || status === "open") where.push(inArray(tasks.status, [...OPEN]));
        else if (status !== "all") where.push(eq(tasks.status, status));

        const before = parseDue(due_before);
        if (before) where.push(lt(tasks.dueAt, before));

        const base = db.select({ t: tasks }).from(tasks).$dynamic();
        const q = tag
          ? base
              .innerJoin(taskTags, eq(taskTags.taskId, tasks.id))
              .innerJoin(tags, eq(tags.id, taskTags.tagId))
              .where(and(...where, eq(tags.ownerId, OWNER_ID), eq(tags.name, tag.trim().toLowerCase())))
          : base.where(and(...where));

        const rows = await q
          .orderBy(desc(tasks.priority), asc(tasks.dueAt), asc(tasks.id))
          .limit(limit ?? 50);

        const found = rows.map((r) => r.t);
        return { found, byTask: await tagsForTasks(OWNER_ID, found.map((t) => t.id)) };
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
          .where(and(eq(tasks.id, id), eq(tasks.ownerId, OWNER_ID)))
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
            .where(and(eq(tasks.id, task_id), eq(tasks.ownerId, OWNER_ID)))
            .limit(1);
          if (!t) return null;
        }
        const [row] = await db
          .insert(logs)
          .values({ ownerId: OWNER_ID, note, taskId: task_id ?? null })
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
      notes: z.string().optional(),
      title: z.string().optional().describe("Only used if this problem hasn't been logged before"),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      url: z.string().optional(),
      topics: z.array(z.string()).optional(),
    },
  },
  async ({ slug, number, outcome, minutes, notes, title, difficulty, url, topics }) =>
    guard(
      async () => {
        if (!slug && number === undefined) throw new Error("Provide a slug or a problem number.");

        let problem = slug
          ? await findProblemBySlug(OWNER_ID, slug)
          : await findProblem(OWNER_ID, String(number));
        if (!problem) {
          problem = await upsertProblem(OWNER_ID, {
            slug: slug ?? `leetcode-${number}`,
            number: number ?? null,
            title: title ?? slug ?? `Problem #${number}`,
            difficulty: difficulty ?? null,
            url: url ?? null,
            topics: topics ?? [],
          });
        }

        const nextAt = await recordAttempt(OWNER_ID, problem.id, outcome as Outcome, {
          minutes,
          notes,
          source: "manual",
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
    description: "List LeetCode problems due for review, most overdue first.",
    inputSchema: {
      limit: z.number().int().min(1).max(100).optional(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    },
  },
  async ({ limit, difficulty }) =>
    guard(
      async () => {
        const rows = await dueReviews(OWNER_ID, limit ?? 20);
        return difficulty ? rows.filter((p) => p.difficulty === difficulty) : rows;
      },
      (rows) =>
        ok(
          rows.length === 0
            ? "Nothing due for review."
            : rows
                .map((p) => {
                  const bits = [p.number ? `#${p.number}` : p.slug, p.title];
                  if (p.difficulty) bits.push(`(${p.difficulty})`);
                  if (p.nextReviewAt) bits.push(`due ${formatDate(p.nextReviewAt)}`);
                  return bits.join(" ");
                })
                .join("\n"),
        ),
    ),
);

async function main() {
  await server.connect(new StdioServerTransport());
  log("ready");
}

main().catch((err) => {
  log("failed to start:", err);
  void sql.end().finally(() => process.exit(1));
});
