# Ember

A single-user task and work log. Runs locally today, deployable later without a
rewrite. Built to be used by one person — auth exists to keep the deployed
instance private to that one person, not to support multiple accounts.

The point is that tasks can be added and completed from inside Claude Code
without switching windows, that a full history of what was worked on survives so
it can be looked at later, and that opening the UI makes you want to do the work
rather than reorganize it.

It also tracks LeetCode practice — see [Practice tracking](#practice-tracking).
That is phase 2 and deliberately outside the one-day budget.

## Constraints

This is a one-day build. Treat these as hard rules.

- Auth (Clerk) exists only to gate the deployed instance to its one owner —
  see [Auth](#auth). No multi-tenant data model, no per-user rows; the schema
  stays exactly as single-user as it always was.
- No CI. No deploy today — but nothing in the code may block a deploy later.
- No tests unless something is genuinely hard to verify by hand.
- No task sharing, assignment, or collaboration features.
- Rows are never deleted. Status changes instead.
- If a feature is not on the list below, it is out of scope.

## Stack

- PostgreSQL 16 in Docker (local, named volume so data persists)
- Drizzle ORM (chosen over Prisma so the MCP server stays a light process)
- `postgres` (postgres.js) as the driver — works unchanged against Docker and
  against Neon/Supabase over TCP
- Next.js App Router + TypeScript for the UI
- Tailwind for styling
- Clerk for auth on the deployed web UI (see [Auth](#auth))
- MCP server: TypeScript, `@modelcontextprotocol/sdk`, stdio transport

The Next.js app and the MCP server share one database and one Drizzle client.
Neither keeps its own state or cache. Whatever Claude Code writes must be visible
in the UI on next load, and vice versa.

### Hosted-ready rules

Running on Docker now, but the following are non-negotiable so that swapping to a
hosted Postgres is a one-line change:

- `src/db/client.ts` reads `DATABASE_URL` and nothing else. No hardcoded host,
  port, user, or password anywhere in the codebase.
- SSL is derived from the connection string (`?sslmode=require`), never
  hardcoded. Docker gets no `sslmode`; Neon gets one. Same code path.
- No state on the filesystem. No local file caches, no SQLite fallback, no
  writing to `/tmp`. Postgres is the only place data lives.
- Schema changes go through `drizzle-kit`. `push` is fine locally; the moment
  there is a hosted DB, switch to `generate` + `migrate` so changes are
  reproducible.
- The MCP server is always a local stdio process. It does not care where the
  database is — it reads the same `DATABASE_URL`. This is the reason deployment
  is cheap: point the env var at Neon and both the deployed UI and your local
  Claude Code session are looking at the same rows.

## Auth and multi-user support

Clerk gates the web UI, and every row in the database carries an `owner_id`
(the signed-in user's email). A handful of trusted people can share one
deployment and one database without seeing each other's tasks or problems.
See the in-app [Help page](/help) for the walkthrough; this is the mechanism
behind it.

- `middleware.ts` protects every route except `/sign-in` and `/sign-up`.
- Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from your
  Clerk dashboard (clerk.com → your application → API Keys) in `.env` locally
  and in the deploy target's environment variables.
- In the Clerk dashboard, turn public sign-up off (Restrictions →
  sign-up mode → restricted or invitation-only), then invite people one at a
  time (Users → Invite) rather than letting anyone who finds the URL create
  an account.
- Every query in `src/db/queries.ts` takes `ownerId` and filters by it; every
  mutation in `src/app/actions.ts` matches `(id, ownerId)`, not `id` alone —
  otherwise one person could act on another's row just by guessing a number,
  since ids are small sequential integers.
- **The MCP server has no session**, unlike the web app, so it can't ask
  Clerk who's using it. It reads `EMBER_OWNER_EMAIL` from its own env at
  startup and fails immediately if that's missing — see the MCP server
  section below.
- **This is app-layer isolation, not database-layer isolation.** Anyone who
  has the raw `DATABASE_URL` — which every person's local MCP config needs —
  can read or write any owner's rows directly via psql or any other client,
  bypassing the app entirely. Fine for a few trusted people; not a
  substitute for real access control if this ever grows past that.

## Repo layout

```
ember/
  docker-compose.yml
  drizzle.config.ts
  src/
    db/
      schema.ts        # single source of truth for the schema
      client.ts        # shared Drizzle client, imported by both app and MCP
      queries.ts       # view queries (today, week, all, streak) in one place
    app/               # Next.js routes
    components/
    lib/
      quotes.ts        # static quote list, no network call
    middleware.ts      # Clerk route protection — see Auth
  mcp/
    server.ts          # stdio MCP server
  .env
```

`queries.ts` exists so the "what counts as due this week" logic is written once
and used by both the UI and (later) any rollup.

## Database

```
tasks
  id            serial pk
  title         text not null
  notes         text
  status        text not null default 'todo'   -- todo | doing | done | dropped
  priority      int  not null default 0        -- 0 none, 1 low, 2 med, 3 high
  due_at        timestamptz
  created_at    timestamptz not null default now()
  completed_at  timestamptz

logs
  id            serial pk
  task_id       int references tasks(id)       -- nullable, for standalone notes
  note          text not null
  created_at    timestamptz not null default now()

tags
  id            serial pk
  name          text not null unique

task_tags
  task_id       int references tasks(id)
  tag_id        int references tags(id)
  primary key (task_id, tag_id)
```

Notes on this:

- `logs` is append only. Nothing in it is ever updated or deleted.
- Completing a task sets `status = 'done'` and stamps `completed_at`.
- Abandoning a task sets `status = 'dropped'`. It stays in the table. Dropped
  tasks are the interesting ones when reviewing later.
- Index `tasks(status)` and `tasks(due_at)`.
- The schema is unchanged from the original sketch. The streak counter and the
  week view are both derivable from `completed_at` and `due_at` — no new columns,
  no denormalized counters to keep in sync.
- Phase 2 adds two more tables, `problems` and `attempts`. They are defined under
  [Practice tracking](#practice-tracking) and do not touch anything above. Day one
  should be built as if they do not exist.

## Quick start

```bash
docker compose up -d
npm install
npx drizzle-kit push        # create tables
npm run dev                 # UI on localhost:3000
```

`.env`:

```
DATABASE_URL=postgresql://postgres:dev@localhost:5434/tasks
LEETCODE_USERNAME=            # phase 2 only, unused on day one
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=   # from clerk.com, only needed to deploy
CLERK_SECRET_KEY=                    # from clerk.com, only needed to deploy
```

To move to hosted later, `DATABASE_URL` is the only thing that changes on the
data side; see [Auth](#auth) for the Clerk keys the deploy target also needs.

## MCP server

Started as four tools; Phase 2 added two more for practice tracking (see
below), bringing it to six across both transports. Resist adding more.

| Tool | Input | Behavior |
|---|---|---|
| `add_task` | title, notes?, priority?, due_at?, tags? | Insert a task with status `todo`. Return the new id. |
| `list_tasks` | status?, due_before?, tag? | Return matching tasks. Default to open work (`todo` and `doing`) when no filter is given. |
| `complete_task` | id | Set status `done`, stamp `completed_at`. |
| `log_note` | note, task_id? | Append to `logs`. Works without a task_id for loose notes. |

Register in Claude Code config — `EMBER_OWNER_EMAIL` must be the email you
sign in with; the server refuses to start without it, since a shared
database has no other way to know whose rows are whose:

```json
{
  "mcpServers": {
    "ember": {
      "command": "node",
      "args": ["/absolute/path/to/ember/mcp/dist/server.mjs"],
      "env": {
        "DATABASE_URL": "same value as .env",
        "EMBER_OWNER_EMAIL": "you@example.com"
      }
    }
  }
}
```

### Connection failures

The Postgres container has to be running or every tool call fails, and the
default driver error is unreadable inside an MCP client. Wrap the connection and
return a plain message on failure, something like: `Cannot reach the ember
database. Is the Docker container running? Try: docker compose up -d`. This is
worth doing properly, since it is the failure that will actually happen.

### Remote MCP server

`src/app/api/mcp/route.ts` exposes the same tool set over Streamable HTTP for
anyone who'd rather not run a local process. It shares tool logic with the
stdio server via `src/mcp/tools.ts` — `createEmberMcpServer(ownerId)` — so
the two transports can never drift apart on behavior, only on how `ownerId`
gets resolved:

- **stdio**: fixed once at process startup, from `EMBER_OWNER_EMAIL`.
- **HTTP**: resolved per request from a personal access token (`mcp_tokens`
  table, SHA-256 hashed, generated and revocable from Settings → Remote MCP
  access). A fresh server and transport are created per request — stateless,
  since different callers mean different owners and Vercel gives no
  guarantee of a warm instance being the same caller twice.

This is arguably the more secure option of the two: a token scopes to
exactly one owner and revokes instantly, where the stdio route requires
handing someone the actual database password. `/api/mcp` is carved out of
Clerk's middleware protection (it has no browser session to check) and
authenticates itself via the `Authorization: Bearer` header instead.

## UI

Three tabs on day one. Phase 2 adds a fourth, Practice.

- **Today**: tasks due today, overdue, and anything with status `doing`.
- **This Week**: open tasks due in the next 7 days, grouped by day.
- **All**: every open task (`todo` and `doing`), grouped by priority. A toggle at
  the bottom reveals recently completed and dropped tasks — that replaces the
  separate Done view rather than adding a fourth tab.

Plus one mode that matters more than the rest:

- **Focus**: pick one task, show only that task, hide all other UI. Escape to go
  back. This is the feature the whole thing exists for.

Interactions needed: add a task, mark done, mark dropped, change priority, add a
log note to a task. That is the complete list.

### The motivational layer

This is deliberate scope, not decoration. It is what makes the app worth opening.

- **Header**: today's date, and a rotating quote picked from a static local list
  in `lib/quotes.ts`. Seeded by the date so it changes once per day rather than
  on every render — a quote that flickers on navigation is noise, not motivation.
  No API call, so it works offline and never blocks a page load.
- **Streak**: consecutive days with at least one task completed, computed from
  `distinct date(completed_at)`. Shown next to the due count. A zero streak
  renders as a neutral prompt, not a scolding.
- **Completion feedback**: marking a task done animates it out rather than making
  it vanish. The counter increments visibly.
- **Design**: dark mode by default with a light option, one accent color, real
  typographic hierarchy, priority shown as a colored dot rather than a word.
  Focus mode is full-bleed — large type, the task and its notes, nothing else.

Rule for this layer: it may never sit between you and the work. No modals on
load, no confetti that blocks input, no streak-loss guilt-tripping.

## Practice tracking

Phase 2. Do not start it until steps 1–6 are done.

A LeetCode problem is not a task. A task is finished once; a problem is something
you attempt repeatedly and get better or worse at. Modeling it as a task would
throw away the only signal that matters — that you solved it clean in March, and
badly again in August.

### Schema

```
problems
  id              serial pk
  slug            text not null unique      -- 'trapping-rain-water'
  number          int                       -- 42, nullable (some have none)
  title           text not null
  difficulty      text                      -- easy | medium | hard
  url             text
  topics          text[] not null default '{}'
  next_review_at  timestamptz
  interval_days   int  not null default 0
  ease            real not null default 2.5
  created_at      timestamptz not null default now()

attempts                                    -- append only
  id            serial pk
  problem_id    int not null references problems(id)
  outcome       text not null   -- solved_clean | solved_hints | saw_solution | failed | accepted
  minutes       int
  notes         text
  source        text not null default 'manual'   -- manual | sync
  attempted_at  timestamptz not null default now()
```

Notes on this:

- `attempts` is append only, same as `logs`. An attempt is never edited, never
  deleted. Re-solving a problem appends; it does not overwrite.
- `next_review_at`, `interval_days` and `ease` are scheduler state. They are a
  fold over the attempt history and could be recomputed from scratch at any time,
  but they are stored on `problems` so the Today query is one indexed scan rather
  than a per-problem replay. If they ever look wrong, recompute rather than patch.
- Index `problems(next_review_at)` and `attempts(problem_id, attempted_at desc)`.
- `topics` is a plain text array, not a join to `tags`. Task tags are yours;
  topic tags come from LeetCode. Keeping them separate avoids a tag list that is
  half "errand" and half "monotonic-stack".

### Review scheduling

SM-2 lite, applied on every inserted attempt using that attempt's outcome:

| Outcome | Effect |
|---|---|
| `solved_clean` | `interval × ease` (ease nudged up, capped at 3.0) |
| `solved_hints` | `interval × 1.3` |
| `accepted` | `interval × 1.5` — sync-created, effort unknown, so scheduled conservatively |
| `saw_solution` | reset to 2 days, ease down 0.2 |
| `failed` | reset to 1 day, ease down 0.2 |

Floor `interval_days` at 1 and `ease` at 1.3. First attempt starts at 1 day.
`next_review_at = now() + interval_days`.

### Sync

`npm run sync:leetcode` pulls recent accepted submissions for the username in
`LEETCODE_USERNAME`:

1. `recentAcSubmissionList(username, 20)` → title, titleSlug, timestamp.
2. For any slug not already in `problems`, one `question(titleSlug)` call for
   difficulty and topic tags. Problems already known are never re-fetched.
3. Upsert the problem, insert an attempt with `outcome = 'accepted'` and
   `source = 'sync'`, then run the scheduler.

Honest limits on this, because they will bite:

- The endpoint is `https://leetcode.com/graphql`. It is undocumented and
  unofficial. It can change or start refusing traffic at any time, and when it
  does the fix is to stop using it, not to fight it. The sync script must fail
  loudly and leave the database untouched — every other part of the app has to
  keep working without it.
- It returns roughly the last 20 accepted submissions. This keeps you current if
  you sync regularly; it is not a backfill. Full submission history needs a
  session cookie, which is not worth handling for a local single-user tool.
- Sync is idempotent on `(problem_id, submission timestamp)`. Running it twice
  inserts nothing the second time.
- A synced attempt records that you solved it, not how it went. Telling Claude
  Code "that one was rough, saw the solution" appends a second, truthful attempt
  and reschedules. So attempt count is not solve count — stats count distinct
  `(problem_id, date(attempted_at))` so a synced row and your rating of it count
  once.

### MCP tools

Two more, bringing it to four task tools and two practice tools. That is the cap.

| Tool | Input | Behavior |
|---|---|---|
| `log_attempt` | slug or number, outcome, minutes?, notes? | Upsert the problem, append an attempt with `source = 'manual'`, run the scheduler, return the next review date. |
| `list_reviews` | limit?, difficulty? | Problems with `next_review_at <= now()`, most overdue first. |

### UI

A fourth tab, **Practice**: problems due for review, then recent attempts, then a
breakdown by topic showing where the failures cluster. That breakdown is the
actual payoff — it answers "what should I drill" without you having to notice the
pattern yourself.

Today gains a second section under the task list: problems due to revisit. It
stays a section, not a merged list — practice and work are different modes and
blending them makes both feel like chores.

Focus mode works on a problem exactly as it does on a task: the statement link,
your notes from last time, nothing else.

### Related

Your `algo-sensei` skill is the natural consumer of this data — the attempt
history and topic breakdown are exactly the context it otherwise has to ask for.
Wiring them together is a later idea, not a build item; noted so it is not
rediscovered from scratch.

## Build order

Do it in this order. Each step leaves something usable if the day runs out.

1. **Schema and Docker.** Postgres up, `schema.ts` defined, pushed, insert a row
   by hand and read it back. Verify `client.ts` touches nothing but
   `DATABASE_URL`.
2. **MCP server.** All four tools, wired into Claude Code, verified by adding a
   real task through conversation. Stop here and the tool is already useful.
3. **UI: Today view.** Read only at first, then add complete and add.
4. **UI: This Week and All.**
5. **Focus mode.**
6. **Motivational layer.** Quotes, streak, completion animation, dark mode pass.

That is the day. Phase 2, on a different day:

7. **Practice schema.** `problems` and `attempts`, plus the scheduler as a pure
   function — given an outcome and current state, return the next state. Easy to
   check by hand, so worth getting right before anything depends on it.
8. **`log_attempt` and `list_reviews`.** Log a real problem through conversation.
   Stop here and it is already useful, same as step 2.
9. **Sync script.** Run it against your real username.
10. **Practice tab and the Today revisit section.**

Deployment is not part of the day. The hosted-ready rules above mean it stays a
half-hour job whenever you want it: create a Neon database, push the schema,
change `DATABASE_URL` in Vercel and in `.env`, done.

## Later, maybe

Do not build these today. Listed so they stay out of scope without being
forgotten.

- Weekly rollup that reads `logs` and summarizes where time went.
- Recurring tasks.
- Keyboard-only navigation.
- Deploy to Vercel + Neon.
