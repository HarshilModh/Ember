import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// The only piece of connection config in the codebase. No host, port, user or
// password appears anywhere else. SSL comes from the connection string
// (`?sslmode=require`), so Docker and a hosted Postgres take the same code path.
const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and try again.",
  );
}

// Next.js recreates modules on every hot reload; without this the pool count
// climbs until Postgres refuses new connections.
const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

const sql = globalForDb.sql ?? postgres(url, { max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export { sql };

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
