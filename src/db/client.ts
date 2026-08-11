import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// The only piece of connection config in the codebase. No host, port, user or
// password appears anywhere else. SSL comes from the connection string
// (`?sslmode=require`), so Docker and a hosted Postgres take the same code path.

type Sql = ReturnType<typeof postgres>;
type Db = ReturnType<typeof drizzle<typeof schema>>;

// Next.js recreates modules on every hot reload; without this the pool count
// climbs until Postgres refuses new connections.
const globalForDb = globalThis as unknown as { sql?: Sql };

/**
 * Constructed lazily, on first real use — never at module load. Next.js
 * imports every route module during its build-time "Collecting page data"
 * step just to read static exports like `runtime`/`dynamic`, even for
 * routes marked fully dynamic, which runs this module's top-level code too.
 * Building a live connection there (postgres.js parses DATABASE_URL via
 * `new URL(...)` internally) depends on the build environment having the
 * exact same env vars as the deployed runtime does, which isn't guaranteed
 * and broke a Vercel build once already. Importing this file must always be
 * safe; only calling into `db`/`sql` needs a real DATABASE_URL.
 */
function connect(): { sql: Sql; db: Db } {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and try again.");
  }
  const sql = globalForDb.sql ?? postgres(url, { max: 5 });
  if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
  return { sql, db: drizzle(sql, { schema }) };
}

let cached: { sql: Sql; db: Db } | undefined;
function get(): { sql: Sql; db: Db } {
  return (cached ??= connect());
}

function proxyTo<T extends object>(getReal: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const real = getReal();
      const value = Reflect.get(real as object, prop);
      return typeof value === "function" ? value.bind(real) : value;
    },
  });
}

export const db: Db = proxyTo(() => get().db);

export const sql: Sql = new Proxy(function sql() {} as unknown as Sql, {
  get(_target, prop) {
    const real = get().sql;
    const value = Reflect.get(real as object, prop);
    return typeof value === "function" ? value.bind(real) : value;
  },
  apply(_target, _thisArg, args) {
    const real = get().sql as unknown as (...a: unknown[]) => unknown;
    return real(...args);
  },
});

const UNREACHABLE = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "CONNECTION_CLOSED",
  "CONNECT_TIMEOUT",
]);

/**
 * The failure that will actually happen: the container is not running. The raw
 * driver error is unreadable inside an MCP client, so callers wrap with this.
 */
export function friendlyDbError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (UNREACHABLE.has(code)) {
    return "Cannot reach the ember database. Is the Docker container running? Try: docker compose up -d";
  }
  if (code === "42P01") {
    return "The ember tables do not exist yet. Try: npm run db:push";
  }
  return err instanceof Error ? err.message : String(err);
}
