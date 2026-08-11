import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { sql } from "../src/db/client";
import { createEmberMcpServer } from "../src/mcp/tools";

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

async function main() {
  // Already validated above; process.exit(1) would have ended the process otherwise.
  const server = createEmberMcpServer(OWNER_ID!);
  await server.connect(new StdioServerTransport());
  log("ready");
}

main().catch((err) => {
  log("failed to start:", err);
  void sql.end().finally(() => process.exit(1));
});
