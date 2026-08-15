import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Multiple people can share one deployment. There is no `users` table — Clerk
 * is the source of truth for identity, so every owned row just carries the
 * signed-in user's email. It is a trust boundary at the app layer only:
 * anyone with the raw DATABASE_URL can still see every owner's rows directly
 * in Postgres. See the Help page / README for that caveat.
 */
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    title: text("title").notNull(),
    notes: text("notes"),
    // todo | doing | done | dropped
    status: text("status").notNull().default("todo"),
    // 0 none, 1 low, 2 med, 3 high
    priority: integer("priority").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("tasks_owner_status_idx").on(t.ownerId, t.status),
    index("tasks_owner_due_at_idx").on(t.ownerId, t.dueAt),
  ],
);

// Append only. Nothing here is ever updated or deleted.
export const logs = pgTable(
  "logs",
  {
    id: serial("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    taskId: integer("task_id").references(() => tasks.id),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("logs_owner_idx").on(t.ownerId)],
);

export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
  },
  (t) => [unique("tags_owner_name_unique").on(t.ownerId, t.name)],
);

export const taskTags = pgTable(
  "task_tags",
  {
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.tagId] })],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Log = typeof logs.$inferSelect;

// Phase 2: practice tracking. Does not touch anything above.
export const problems = pgTable(
  "problems",
  {
    id: serial("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    slug: text("slug").notNull(),
    number: integer("number"),
    title: text("title").notNull(),
    // easy | medium | hard
    difficulty: text("difficulty"),
    url: text("url"),
    topics: text("topics").array().notNull().default([]),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    intervalDays: integer("interval_days").notNull().default(0),
    ease: real("ease").notNull().default(2.5),
    // Manual "come back to this" flag, independent of the SM-2 schedule above —
    // set by the user/Claude, not by the review algorithm.
    pinnedForRevisit: boolean("pinned_for_revisit").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("problems_owner_slug_unique").on(t.ownerId, t.slug),
    index("problems_owner_next_review_idx").on(t.ownerId, t.nextReviewAt),
    index("problems_owner_pinned_idx").on(t.ownerId, t.pinnedForRevisit),
  ],
);

// Append only, same as logs. Re-solving a problem appends; it never overwrites.
export const attempts = pgTable(
  "attempts",
  {
    id: serial("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problems.id),
    // solved_clean | solved_hints | saw_solution | failed | accepted
    outcome: text("outcome").notNull(),
    minutes: integer("minutes"),
    notes: text("notes"),
    // manual | sync
    source: text("source").notNull().default("manual"),
    // Technique/pattern used to solve it (e.g. "two pointers"), separate from
    // free-form `notes` so the UI can show it distinctly.
    approach: text("approach"),
    // True Anki-style revision (blank-file resolve), not a same-day retry —
    // lets a "solved clean, then failed on revision" regression be detected
    // instead of just quietly rescheduling.
    isRevision: boolean("is_revision").notNull().default(false),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("attempts_owner_problem_attempted_idx").on(t.ownerId, t.problemId, t.attemptedAt)],
);

export type Problem = typeof problems.$inferSelect;
export type NewProblem = typeof problems.$inferInsert;
export type Attempt = typeof attempts.$inferSelect;
export type Outcome = "solved_clean" | "solved_hints" | "saw_solution" | "failed" | "accepted";

/**
 * Personal access tokens for the remote (HTTP) MCP server — the deployed
 * site has no local process to trust the way the stdio server does, so a
 * caller has to prove who it's acting for. Only the hash is ever stored; the
 * plaintext is shown once at creation and is not recoverable after that.
 */
export const mcpTokens = pgTable(
  "mcp_tokens",
  {
    id: serial("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (t) => [index("mcp_tokens_owner_idx").on(t.ownerId)],
);

export type McpToken = typeof mcpTokens.$inferSelect;

/**
 * One row per owner — the pomodoro timer follows a person across devices,
 * not any single browser. `secondsLeft` is a snapshot taken whenever `running`
 * or `phase` changes (not on every 1s tick); readers reconstruct the live
 * countdown from `secondsLeft` + `updatedAt` the same way the old
 * localStorage-only restore logic did, just now across devices instead of
 * across page reloads.
 */
export const focusSessions = pgTable("focus_sessions", {
  ownerId: text("owner_id").primaryKey(),
  phase: text("phase").notNull().default("focus"),
  running: boolean("running").notNull().default(false),
  secondsLeft: integer("seconds_left").notNull(),
  totalDuration: integer("total_duration").notNull(),
  focusCount: integer("focus_count").notNull().default(0),
  activeTaskId: integer("active_task_id").references(() => tasks.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FocusSessionRow = typeof focusSessions.$inferSelect;
